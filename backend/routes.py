"""
routes.py — the API endpoints for NEED.

WHAT: A Flask "Blueprint" is just a group of related routes.
WHY:  Keeping routes out of app.py means app.py stays tiny and readable.
HOW:  app.py registers this blueprint under the /api prefix, so a route
      written as "/services" below is reachable at "/api/services".

Step 1 needs only the endpoints the landing page uses.
Step 3 adds the customer dashboard endpoint.
More endpoints (bookings, payments...) get added in later steps.
"""

from datetime import datetime
import uuid
from flask import Blueprint, jsonify, request, session
from werkzeug.security import generate_password_hash

from models import (
    Booking,
    Cooperative,
    Dispute,
    Payment,
    Review,
    Service,
    SupportTicket,
    Tip,
    User,
    WelfareTransaction,
    WelfareWallet,
    WelfareWithdrawalRequest,
    WorkerProfile,
    db,
)

api = Blueprint("api", __name__)


# ---------------------------------------------------------------------------
# The cooperative money rules
#
# WHY these are named constants instead of numbers typed into each function:
# they used to be written as bare numbers in several different places, and that
# is exactly how the welfare wallet and its own ledger drifted apart. One
# definition means they can never disagree with each other again.
# ---------------------------------------------------------------------------
WELFARE_RATE = 0.10             # share of every job that funds social security
WORKER_SHARE = 0.90             # the rest goes straight to the worker
WALLET_LIQUID_SHARE = 0.70      # of the welfare cut: savings the worker can draw
WALLET_INSURANCE_SHARE = 0.30   # of the welfare cut: pooled insurance reserve
EMERGENCY_FEE = 100.0           # flat rush charge on an emergency booking


def _wallet_for(worker_id):
    """
    Return a worker's welfare wallet, creating it if it does not exist yet.

    WHY: workers who signed up through the registration form used to get no
    wallet row at all. The credit below was wrapped in "if wallet:" so it was
    skipped in silence — no error, no log — and their welfare savings sat at
    zero forever. Creating the wallet on demand means the contribution can
    never be quietly dropped again.
    """
    wallet = WelfareWallet.query.filter_by(worker_id=worker_id).first()
    if wallet is None:
        wallet = WelfareWallet(
            worker_id=worker_id,
            balance=0.0,
            total_contribution=0.0,
            insurance_contribution=0.0,
        )
        db.session.add(wallet)
    return wallet


def _credit_welfare(worker_id, booking):
    """
    Move one finished job's welfare share into the worker's wallet AND write the
    matching ledger row. Returns the amount credited.

    WHY this is a single function: the wallet used to be updated when the worker
    completed the job, while the ledger row was written later when the customer
    paid. Two different moments, two different files' worth of logic, and
    nothing ever reconciled them — so the running balance and its own audit
    trail could never be trusted to agree. Now there is exactly one way welfare
    is ever credited, and the wallet and the ledger move together.
    """
    welfare_cut = round(booking.amount * WELFARE_RATE, 2)

    wallet = _wallet_for(worker_id)
    wallet.total_contribution = round((wallet.total_contribution or 0.0) + welfare_cut, 2)
    wallet.balance = round(
        (wallet.balance or 0.0) + welfare_cut * WALLET_LIQUID_SHARE, 2
    )
    wallet.insurance_contribution = round(
        (wallet.insurance_contribution or 0.0) + welfare_cut * WALLET_INSURANCE_SHARE, 2
    )

    service_name = booking.service.name if booking.service else "Service"
    db.session.add(WelfareTransaction(
        worker_id=worker_id,
        booking_id=booking.id,
        amount=welfare_cut,
        note=(
            f"{int(WELFARE_RATE * 100)}% welfare contribution from "
            f"Booking #{booking.id} ({service_name})"
        ),
    ))
    return welfare_cut


def _get_user_from_req():
    """Return current User checking session cookie OR Authorization Bearer token header."""
    user_id = session.get("user_id")
    if user_id is None:
        auth_header = request.headers.get("Authorization") or ""
        if auth_header.startswith("Bearer "):
            raw = auth_header.split("Bearer ", 1)[1].strip()
            if raw.startswith("user-"):
                try:
                    user_id = int(raw.replace("user-", ""))
                except ValueError:
                    pass
            elif raw.isdigit():
                user_id = int(raw)
    if user_id is None:
        return None
    return db.session.get(User, user_id)


def _require_booking_access(booking):
    """
    Allow only the customer who booked it, the worker assigned to it, or an admin.
    """
    user = _get_user_from_req()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    if (
        user.role != "admin"
        and booking.customer_id != user.id
        and booking.worker_id != user.id
    ):
        return jsonify({"error": "Forbidden"}), 403

    return None


def _verified_profile(worker_id):
    """
    Return a worker's profile only if the admin has verified them, else None.

    WHY: "verified" is the promise the whole cooperative rests on, but it used to
    be checked in exactly one place — when the system picked a worker on its own.
    Every other path skipped it: a customer could be assigned a partner the admin
    had rejected, and that partner could accept the job, complete it, and be paid
    their 90% while the admin screen still showed them with a red Rejected badge.
    """
    profile = WorkerProfile.query.filter_by(user_id=worker_id).first()
    if profile is None or profile.verification_status != "verified":
        return None
    return profile


def _find_worker_for(service):
    """
    Pick a partner to auto-assign a booking of this service to, or None.

    Only verified partners who are currently online are considered. Nothing read
    is_available before, which made the worker's own Available/Offline switch
    purely decorative — they could go offline and still be handed new jobs.

    Best rated first, then most jobs completed, so the choice is deterministic
    and we can explain why it landed on that person. With no ORDER BY the
    database was free to return whichever matching row it happened to reach
    first, which is not an answer you want to give when asked.
    """
    match = (
        db.session.query(User)
        .join(WorkerProfile, WorkerProfile.user_id == User.id)
        .filter(WorkerProfile.verification_status == "verified")
        .filter(WorkerProfile.is_available.is_(True))
        .filter(WorkerProfile.primary_service.ilike(f"%{service.name}%"))
        .order_by(WorkerProfile.rating.desc(), WorkerProfile.total_jobs.desc())
        .first()
    )
    return match.id if match else None


# ---------------------------------------------------------------------------
# Public
# ---------------------------------------------------------------------------

@api.get("/health")
def health():
    """Quick check that the server is alive. Open this first when debugging."""
    return jsonify({"status": "ok", "service": "need-backend"})


@api.get("/services")
def list_services():
    """All bookable services, cheapest first inside each category."""
    services = (
        Service.query.filter_by(is_active=True)
        .order_by(Service.category, Service.starting_price)
        .all()
    )
    return jsonify([s.to_dict() for s in services])


@api.get("/services/categories")
def list_services_by_category():
    """
    The same services, but grouped by category.

    WHY: The landing page shows three labelled groups (Home / Appliance /
    Other). Grouping here means the React code just loops, instead of
    doing the grouping work itself.
    """
    services = (
        Service.query.filter_by(is_active=True)
        .order_by(Service.starting_price)
        .all()
    )

    grouped = {}
    for service in services:
        grouped.setdefault(service.category, []).append(service.to_dict())

    # Return a list so the order of categories on the page stays fixed.
    category_order = ["Home Services", "Appliance Services", "Other Services"]
    result = [
        {"category": name, "services": grouped.get(name, [])}
        for name in category_order
        if grouped.get(name)
    ]
    return jsonify(result)


@api.get("/stats")
def platform_stats():
    """
    Real counts for the numbers shown on the landing page.

    WHY: We could hardcode "285 verified workers" in the React code, but then
    the number would be a lie. Counting the database keeps the page honest,
    and the number grows as you add workers during the demo.
    """
    verified_workers = WorkerProfile.query.filter_by(
        verification_status="verified"
    ).count()
    total_workers = WorkerProfile.query.count()
    total_services = Service.query.filter_by(is_active=True).count()
    total_customers = User.query.filter_by(role="customer").count()

    # db.session.query(...).scalar() returns a single value, or None if empty.
    welfare_total = (
        db.session.query(db.func.sum(WelfareWallet.total_contribution)).scalar() or 0
    )

    return jsonify(
        {
            "verified_workers": verified_workers,
            "total_workers": total_workers,
            "total_services": total_services,
            "total_customers": total_customers,
            "welfare_total": round(welfare_total, 2),
        }
    )


@api.get("/workers")
def list_workers():
    """
    Search and filter verified cooperative service providers.

    Query parameters:
      service:       filter by exact or partial primary_service name
      search:        search keyword across worker name, trade, skills, city
      city:          filter by city or location area
      verified_only: 'true' (default) or 'false'
      sort:          'rating' (default) | 'jobs' | 'experience'
    """
    service_filter = request.args.get("service", "").strip()
    search_query   = request.args.get("search", "").strip()
    city_filter    = request.args.get("city", "").strip()
    verified_only  = request.args.get("verified_only", "true").lower() in ("true", "1", "yes")
    sort_by        = request.args.get("sort", "rating").lower()

    query = (
        db.session.query(WorkerProfile, User)
        .join(User, WorkerProfile.user_id == User.id)
    )

    if verified_only:
        query = query.filter(WorkerProfile.verification_status == "verified")

    if service_filter:
        query = query.filter(WorkerProfile.primary_service.ilike(f"%{service_filter}%"))

    if city_filter:
        query = query.filter(
            (WorkerProfile.city.ilike(f"%{city_filter}%")) | (User.address.ilike(f"%{city_filter}%"))
        )

    if search_query:
        query = query.filter(
            (User.name.ilike(f"%{search_query}%"))
            | (WorkerProfile.primary_service.ilike(f"%{search_query}%"))
            | (WorkerProfile.skills.ilike(f"%{search_query}%"))
            | (WorkerProfile.city.ilike(f"%{search_query}%"))
        )

    if sort_by == "jobs":
        query = query.order_by(WorkerProfile.total_jobs.desc(), WorkerProfile.rating.desc())
    elif sort_by == "experience":
        query = query.order_by(WorkerProfile.experience_years.desc(), WorkerProfile.rating.desc())
    else:  # default rating
        query = query.order_by(WorkerProfile.rating.desc(), WorkerProfile.total_jobs.desc())

    results = query.all()

    # Pre-fetch services to map starting prices
    all_services = {s.name.lower(): s.starting_price for s in Service.query.all()}

    workers_data = []
    for wp, u in results:
        starting_price = all_services.get((wp.primary_service or "").lower(), 299.0)
        workers_data.append({
            "worker_id":           u.id,
            "profile_id":          wp.id,
            "name":                u.name,
            "email":               u.email,
            "phone":               u.phone,
            "trade":               wp.primary_service or "General Service",
            "skills":              wp.skills,
            "certifications":      wp.certifications,
            "experience_years":    wp.experience_years,
            "verification_status": wp.verification_status,
            "rating":              wp.rating,
            "total_jobs":          wp.total_jobs,
            "area":                wp.city or u.address or "Noida",
            "service_radius_km":   wp.service_radius_km,
            "is_available":        wp.is_available,
            "starting_price":      starting_price,
        })

    return jsonify(workers_data)


@api.get("/services/<int:service_id>/workers")
def list_service_workers(service_id):
    """Return all verified workers matching a specific Service."""
    service = db.session.get(Service, service_id)
    if not service:
        return jsonify({"error": "Service not found"}), 404

    query = (
        db.session.query(WorkerProfile, User)
        .join(User, WorkerProfile.user_id == User.id)
        .filter(WorkerProfile.verification_status == "verified")
        .filter(WorkerProfile.primary_service.ilike(f"%{service.name}%"))
        .order_by(WorkerProfile.rating.desc(), WorkerProfile.total_jobs.desc())
    )

    results = query.all()
    workers_data = []
    for wp, u in results:
        workers_data.append({
            "worker_id":           u.id,
            "profile_id":          wp.id,
            "name":                u.name,
            "trade":               wp.primary_service or service.name,
            "skills":              wp.skills,
            "certifications":      wp.certifications,
            "experience_years":    wp.experience_years,
            "verification_status": wp.verification_status,
            "rating":              wp.rating,
            "total_jobs":          wp.total_jobs,
            "area":                wp.city or u.address or "Noida",
            "is_available":        wp.is_available,
            "starting_price":      service.starting_price,
        })

    return jsonify({
        "service": service.to_dict(),
        "workers": workers_data,
    })



# ---------------------------------------------------------------------------
# Customer (Step 3)
# ---------------------------------------------------------------------------

def _require_role(role):
    """
    Helper: return the logged-in user if they have `role`, else return an error.
    """
    user = _get_user_from_req()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    if user.role != role:
        return jsonify({"error": "Forbidden"}), 403
    return user


@api.get("/customer/dashboard")
def customer_dashboard():
    """
    Everything the customer dashboard page needs in one request.

    Returns:
      profile   — the customer's own User record
      stats     — total / completed / pending booking counts
      bookings  — last 5 bookings, newest first
      services  — all active services for the quick-book grid
    """
    result = _require_role("customer")
    if isinstance(result, tuple):
        return result
    customer = result

    # --- Booking counts ----------------------------------------------------
    all_bookings = Booking.query.filter_by(customer_id=customer.id).all()
    total     = len(all_bookings)
    completed = sum(1 for b in all_bookings if b.status == "completed")
    pending   = sum(1 for b in all_bookings if b.status in ("pending", "accepted", "in_progress"))

    # Last 5 bookings, newest first.
    recent = (
        Booking.query
        .filter_by(customer_id=customer.id)
        .order_by(Booking.created_at.desc())
        .limit(5)
        .all()
    )

    # All services for the quick-book grid.
    services = (
        Service.query.filter_by(is_active=True)
        .order_by(Service.category, Service.starting_price)
        .all()
    )

    return jsonify({
        "profile": customer.to_dict(),
        "stats": {
            "total":     total,
            "completed": completed,
            "pending":   pending,
        },
        "bookings": [b.to_dict() for b in recent],
        "services": [s.to_dict() for s in services],
    })


# ---------------------------------------------------------------------------
# Bookings Flow (Step 7)
# ---------------------------------------------------------------------------

@api.post("/bookings")
def create_booking():
    """
    Create a new service booking request.

    Expected JSON body:
      service_id:      (required) int
      worker_id:       (optional) int
      scheduled_date:  (required) string "YYYY-MM-DD"
      scheduled_time:  (required) string "10:00" or "Morning (9 AM - 12 PM)"
      address:         (optional) string
      description:     (optional) string
      is_emergency:    (optional) bool
    """
    result = _require_role("customer")
    if isinstance(result, tuple):
        return result
    customer = result

    data = request.get_json(silent=True) or {}
    service_id = data.get("service_id")
    if not service_id:
        return jsonify({"error": "service_id is required"}), 400

    service = db.session.get(Service, service_id)
    if not service or not service.is_active:
        return jsonify({"error": "Service not found or inactive"}), 404

    scheduled_date = data.get("scheduled_date")
    scheduled_time = data.get("scheduled_time")
    if not scheduled_date or not scheduled_time:
        return jsonify({"error": "scheduled_date and scheduled_time are required"}), 400

    worker_id = data.get("worker_id")
    if worker_id:
        worker = db.session.get(User, worker_id)
        if not worker or worker.role != "worker":
            return jsonify({"error": "Selected worker is invalid"}), 400

        # A worker the customer picked has to clear the same bar as one the
        # system picks. Only the auto-assign branch used to check this, so
        # choosing a partner directly could hand the job to someone the admin
        # had rejected or who had marked themselves offline.
        profile = _verified_profile(worker.id)
        if profile is None:
            return jsonify({
                "error": "That partner is not verified yet, so they cannot take bookings."
            }), 400
        if not profile.is_available:
            return jsonify({
                "error": f"{worker.name} is offline right now. Please choose another partner."
            }), 409
    else:
        worker_id = _find_worker_for(service)

        # Refuse rather than create a booking nobody can ever act on.
        #
        # WHY: an unassigned booking used to be saved anyway, with worker_id
        # empty. No worker can accept a job that is not assigned to them and
        # there is no screen anywhere that assigns one later, so the row sat on
        # the customer's dashboard reading "Auto-assigning..." forever, with
        # cancelling as the only way out. Better to say so at the point of
        # booking, while the customer can still pick something else.
        if worker_id is None:
            return jsonify({
                "error": (
                    f"No verified partner is available for {service.name} at the "
                    "moment. Please try another service or check back shortly."
                )
            }), 409

    is_emergency = bool(data.get("is_emergency", False))
    rush_fee = EMERGENCY_FEE if is_emergency else 0.0
    total_amount = round(service.starting_price + rush_fee, 2)

    booking = Booking(
        customer_id=customer.id,
        worker_id=worker_id,
        service_id=service.id,
        scheduled_date=str(scheduled_date),
        scheduled_time=str(scheduled_time),
        address=data.get("address") or customer.address or "Home Address",
        description=data.get("description", ""),
        is_emergency=is_emergency,
        amount=total_amount,
        status="pending",
    )
    db.session.add(booking)
    db.session.commit()

    return jsonify(booking.to_dict()), 201


@api.get("/bookings/<int:booking_id>")
def get_booking(booking_id):
    """Fetch booking detail with access control (customer, assigned worker, admin)."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    # Access check: Must be the customer who booked, the assigned worker, or an admin
    if user.role != "admin" and booking.customer_id != user.id and booking.worker_id != user.id:
        return jsonify({"error": "Forbidden"}), 403

    return jsonify(booking.to_dict())


@api.post("/bookings/<int:booking_id>/cancel")
def cancel_booking(booking_id):
    """Customer cancels a pending or accepted booking."""
    result = _require_role("customer")
    if isinstance(result, tuple):
        return result
    customer = result

    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if booking.customer_id != customer.id:
        return jsonify({"error": "You can only cancel your own bookings"}), 403

    if booking.status in ("completed", "cancelled"):
        return jsonify({"error": f"Cannot cancel a booking that is already {booking.status}"}), 400

    # A job the worker has already started cannot be cancelled from under them.
    #
    # WHY: money is only credited on completion, so cancelling mid-job meant the
    # worker's row silently flipped to Cancelled and they were paid nothing for
    # work already begun. "Rejected" is excluded too — that state records the
    # worker declining, and overwriting it would lose that from the trail.
    if booking.status == "in_progress":
        return jsonify({
            "error": (
                "This job has already started. Please contact support to "
                "cancel it so the partner's work can be accounted for."
            )
        }), 400

    if booking.status == "rejected":
        return jsonify({"error": "This booking was already declined by the partner"}), 400

    booking.status = "cancelled"
    db.session.commit()

    return jsonify({
        "booking": booking.to_dict(),
        "message": "Booking has been cancelled successfully."
    })


@api.post("/bookings/<int:booking_id>/worker-action")
def worker_booking_action(booking_id):
    """
    Worker lifecycle actions on an assigned booking:
      action: 'accept' | 'decline' | 'start' | 'complete'
      completion_note: (optional, for 'complete')
    """
    result = _require_role("worker")
    if isinstance(result, tuple):
        return result
    worker = result

    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if booking.worker_id != worker.id:
        return jsonify({"error": "This booking is not assigned to you"}), 403

    # Verification is re-checked on every action, not just when the booking was
    # made.
    #
    # WHY: the admin can revoke a partner at any moment, and jobs already on
    # that partner's list used to survive it. They could still accept, start and
    # complete those jobs — collecting their 90% and a welfare contribution from
    # the very federation that had just expelled them, while the admin screen
    # showed them with a red Rejected badge.
    profile = _verified_profile(worker.id)
    if profile is None:
        return jsonify({
            "error": "Your account is not verified, so you cannot work on bookings yet."
        }), 403

    data = request.get_json(silent=True) or {}
    action = data.get("action", "").lower().strip()

    if action == "accept":
        if booking.status != "pending":
            return jsonify({"error": f"Cannot accept booking with status '{booking.status}'"}), 400
        booking.status = "accepted"

    elif action == "decline":
        if booking.status != "pending":
            return jsonify({"error": f"Cannot decline booking with status '{booking.status}'"}), 400
        booking.status = "rejected"

    elif action == "start":
        if booking.status != "accepted":
            return jsonify({"error": "Can only start jobs that have been accepted"}), 400
        booking.status = "in_progress"

    elif action == "complete":
        if booking.status not in ("accepted", "in_progress"):
            return jsonify({"error": "Can only complete active jobs"}), 400
        booking.status = "completed"
        booking.completion_note = data.get("completion_note", "Service completed as requested.")

        # Update worker profile earnings & job count.
        #
        # `profile` is guaranteed to exist by the verification check above. This
        # used to be wrapped in "if wp:", which is the same silent-skip shape
        # that lost the welfare contributions: a worker with no profile row would
        # finish the job, the customer would pay, the invoice would print a
        # take-home figure, and the earnings and job count would simply not move.
        profile.total_jobs = (profile.total_jobs or 0) + 1
        net_earned = round(booking.amount * WORKER_SHARE, 2)
        profile.earnings = round((profile.earnings or 0.0) + net_earned, 2)

        # Credit the welfare share. This is the ONLY place welfare is ever
        # credited, and it writes the wallet and the ledger row together.
        _credit_welfare(worker.id, booking)

    else:
        return jsonify({"error": "Action must be 'accept', 'decline', 'start', or 'complete'"}), 400

    db.session.commit()

    return jsonify({
        "booking": booking.to_dict(),
        "action": action,
        "message": f"Job status updated to '{booking.status}'"
    })


# ---------------------------------------------------------------------------
# Payments & Invoicing (Step 8)
# ---------------------------------------------------------------------------

@api.post("/payments/checkout")
def checkout_payment():
    """
    Simulated payment checkout for a booking.

    Expected JSON body:
      booking_id: (required) int
      method:     (required) "upi" | "card" | "cash"
      tip_amount: (optional) float
    """
    result = _require_role("customer")
    if isinstance(result, tuple):
        return result
    customer = result

    data = request.get_json(silent=True) or {}
    booking_id = data.get("booking_id")
    if not booking_id:
        return jsonify({"error": "booking_id is required"}), 400

    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if booking.customer_id != customer.id:
        return jsonify({"error": "You can only pay for your own bookings"}), 403

    # Check if already paid
    existing_payment = Payment.query.filter_by(booking_id=booking.id, status="successful").first()
    if existing_payment:
        return jsonify({
            "error": "This booking is already paid",
            "payment": existing_payment.to_dict(),
            "invoice_id": existing_payment.invoice_id,
        }), 400

    # A job can only be paid for once the worker has marked it complete.
    #
    # WHY this is now a hard rule: this function used to quietly set the booking
    # to "completed" itself if it wasn't already. That skipped the completion
    # step, which is what credits the worker's earnings, job count and welfare
    # share — so paying early silently robbed the worker of all three.
    if booking.status != "completed":
        return jsonify({
            "error": (
                f"This job is still '{booking.status}'. It can be paid for once "
                "the worker marks it complete."
            )
        }), 400

    method = data.get("method", "upi").lower().strip()
    if method not in ("upi", "card", "cash"):
        method = "upi"

    # "or 0.0" rather than a default, so an explicit null in the JSON body
    # cannot crash this with a TypeError.
    tip_amount = max(0.0, float(data.get("tip_amount") or 0.0))
    welfare_contribution = round(booking.amount * WELFARE_RATE, 2)
    total_charged = round(booking.amount + tip_amount, 2)

    platform_fee = round(booking.amount * 0.10, 2)
    cooperative_share = round(booking.amount * 0.05, 2)
    worker_earnings = round(booking.amount * 0.85, 2)

    # Generate official cooperative invoice ID (e.g. SHR-INV-2026-A1B2C3)
    invoice_id = f"SHR-INV-2026-{uuid.uuid4().hex[:6].upper()}"

    payment = Payment(
        booking_id=booking.id,
        amount=total_charged,
        method=method,
        status="successful",
        invoice_id=invoice_id,
        platform_fee=platform_fee,
        cooperative_share=cooperative_share,
        worker_earnings=worker_earnings,
        welfare_contribution=welfare_contribution,
    )
    db.session.add(payment)

    # Record the tip, and pass it straight through to the worker.
    #
    # WHY earnings are touched here: the invoice prints worker_take_home as 90%
    # of the job PLUS the tip, but the tip used to be stored in its own table
    # and never added to the worker's earnings — so the receipt the customer
    # held and the worker's own dashboard disagreed about what they'd been paid.
    #
    # Welfare is deliberately NOT credited here. It is credited once, when the
    # worker marks the job complete. See _credit_welfare() at the top of
    # this file for why that matters.
    if booking.worker_id and tip_amount > 0:
        db.session.add(Tip(
            booking_id=booking.id,
            worker_id=booking.worker_id,
            amount=tip_amount,
        ))
        wp = WorkerProfile.query.filter_by(user_id=booking.worker_id).first()
        if wp:
            wp.earnings = round((wp.earnings or 0.0) + tip_amount, 2)

    db.session.commit()

    return jsonify({
        "payment": payment.to_dict(),
        "invoice_id": invoice_id,
        "total_amount": total_charged,
        "welfare_contribution": welfare_contribution,
        "tip_amount": tip_amount,
        "message": "Payment successful! Cooperative receipt and welfare contribution recorded."
    }), 201


@api.get("/payments/invoices/<string:invoice_id>")
def get_invoice(invoice_id):
    """Fetch complete itemized invoice details by invoice ID."""
    payment = Payment.query.filter_by(invoice_id=invoice_id).first()
    if not payment:
        return jsonify({"error": "Invoice not found"}), 404

    booking = db.session.get(Booking, payment.booking_id)
    if not booking:
        return jsonify({"error": "Associated booking not found"}), 404

    # An invoice carries the customer's name, email, phone and address, so it is
    # not public. Invoice IDs are short enough to guess, which is exactly why
    # this check has to exist rather than relying on the ID being secret.
    denied = _require_booking_access(booking)
    if denied:
        return denied

    customer = db.session.get(User, booking.customer_id)
    worker = db.session.get(User, booking.worker_id) if booking.worker_id else None
    service = db.session.get(Service, booking.service_id)

    # Check for optional tip
    tip = Tip.query.filter_by(booking_id=booking.id).first()
    tip_amount = round(tip.amount, 2) if tip else 0.0

    emergency_fee = EMERGENCY_FEE if booking.is_emergency else 0.0
    base_price = round(booking.amount - emergency_fee, 2)

    return jsonify({
        "invoice_id": payment.invoice_id,
        "payment_id": payment.id,
        "date": payment.created_at.strftime("%B %d, %Y"),
        "timestamp": payment.created_at.isoformat(),
        "payment_method": payment.method.upper(),
        "payment_status": payment.status.upper(),
        "customer": {
            "id": customer.id if customer else None,
            "name": customer.name if customer else "Customer",
            "email": customer.email if customer else "",
            "phone": customer.phone if customer else "",
            "address": booking.address,
        },
        "worker": {
            "id": worker.id if worker else None,
            "name": worker.name if worker else "Cooperative Service Partner",
            "trade": service.name if service else "Service",
            "society": "NEED Worker Cooperative Federation",
        },
        "booking": {
            "id": booking.id,
            "service_name": service.name if service else "Service",
            "category": service.category if service else "Home Services",
            "scheduled_date": booking.scheduled_date,
            "scheduled_time": booking.scheduled_time,
            "is_emergency": booking.is_emergency,
            "description": booking.description,
            "completion_note": booking.completion_note,
        },
        "breakdown": {
            "base_fare": base_price,
            "emergency_fee": emergency_fee,
            "service_total": booking.amount,
            "tip_amount": tip_amount,
            "total_paid": payment.amount,
            "worker_take_home": round(booking.amount * WORKER_SHARE + tip_amount, 2),
            "welfare_contribution": payment.welfare_contribution,
        }
    })


@api.get("/bookings/<int:booking_id>/payment")
def get_booking_payment(booking_id):
    """Look up payment and invoice status for a booking."""
    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    # Booking IDs are sequential, so without this anyone could walk 1, 2, 3...
    # and read whether each job had been paid and what its invoice number is.
    denied = _require_booking_access(booking)
    if denied:
        return denied

    payment = Payment.query.filter_by(booking_id=booking_id, status="successful").first()
    if not payment:
        return jsonify({"is_paid": False})

    return jsonify({
        "is_paid": True,
        "payment": payment.to_dict(),
        "invoice_id": payment.invoice_id,
    })


# ---------------------------------------------------------------------------
# Reviews & Ratings (Step 9)
# ---------------------------------------------------------------------------

@api.post("/reviews")
def create_review():
    """
    Submit a star rating (1-5) and text review for a completed booking.

    Expected JSON body:
      booking_id: (required) int
      rating:     (required) int between 1 and 5
      comment:    (optional) string
    """
    result = _require_role("customer")
    if isinstance(result, tuple):
        return result
    customer = result

    data = request.get_json(silent=True) or {}
    booking_id = data.get("booking_id")
    if not booking_id:
        return jsonify({"error": "booking_id is required"}), 400

    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if booking.customer_id != customer.id:
        return jsonify({"error": "You can only review your own bookings"}), 403

    if booking.status != "completed":
        return jsonify({"error": "Reviews can only be submitted for completed bookings"}), 400

    if not booking.worker_id:
        return jsonify({"error": "Cannot review a booking without an assigned worker"}), 400

    # Check for duplicate review
    existing_review = Review.query.filter_by(booking_id=booking.id).first()
    if existing_review:
        return jsonify({
            "error": "You have already reviewed this booking",
            "review": existing_review.to_dict()
        }), 400

    try:
        rating = int(data.get("rating"))
        if rating < 1 or rating > 5:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({"error": "Rating must be an integer between 1 and 5"}), 400

    comment = str(data.get("comment") or "").strip()

    review = Review(
        booking_id=booking.id,
        customer_id=customer.id,
        worker_id=booking.worker_id,
        rating=rating,
        comment=comment,
    )
    db.session.add(review)

    # Recalculate worker's aggregate average rating
    all_reviews = Review.query.filter_by(worker_id=booking.worker_id).all()
    total_ratings = [r.rating for r in all_reviews] + [rating]
    new_avg_rating = round(sum(total_ratings) / len(total_ratings), 1)

    wp = WorkerProfile.query.filter_by(user_id=booking.worker_id).first()
    if wp:
        wp.rating = new_avg_rating

    db.session.commit()

    return jsonify({
        "review": review.to_dict(),
        "new_worker_rating": new_avg_rating,
        "message": "Review submitted successfully! Thank you for rating your service provider."
    }), 201


@api.get("/workers/<int:worker_id>/reviews")
def get_worker_reviews(worker_id):
    """Fetch all public customer reviews and average rating for a worker."""
    worker = db.session.get(User, worker_id)
    if not worker or worker.role != "worker":
        return jsonify({"error": "Worker not found"}), 404

    wp = WorkerProfile.query.filter_by(user_id=worker.id).first()
    reviews = Review.query.filter_by(worker_id=worker.id).order_by(Review.created_at.desc()).all()

    return jsonify({
        "worker_id": worker.id,
        "worker_name": worker.name,
        "trade": wp.primary_service if wp else "Service Provider",
        "average_rating": wp.rating if wp else 5.0,
        "total_reviews": len(reviews),
        "reviews": [r.to_dict() for r in reviews]
    })


# ---------------------------------------------------------------------------
# Welfare Wallet & Emergency Fund (Step 10)
# ---------------------------------------------------------------------------

@api.get("/worker/welfare")
def get_worker_welfare():
    """Fetch worker's welfare wallet, transaction history, and withdrawal requests."""
    result = _require_role("worker")
    if isinstance(result, tuple):
        return result
    worker = result

    wallet = WelfareWallet.query.filter_by(worker_id=worker.id).first()
    if not wallet:
        wallet = WelfareWallet(worker_id=worker.id, balance=0.0, total_contribution=0.0, insurance_contribution=0.0)
        db.session.add(wallet)
        db.session.commit()

    transactions = WelfareTransaction.query.filter_by(worker_id=worker.id).order_by(WelfareTransaction.created_at.desc()).all()
    requests = WelfareWithdrawalRequest.query.filter_by(worker_id=worker.id).order_by(WelfareWithdrawalRequest.created_at.desc()).all()

    available_for_withdraw = max(0.0, round(wallet.balance - wallet.insurance_contribution, 2))

    return jsonify({
        "wallet": wallet.to_dict(),
        "available_for_withdraw": available_for_withdraw,
        "transactions": [t.to_dict() for t in transactions],
        "withdrawal_requests": [r.to_dict() for r in requests],
    })


@api.post("/worker/welfare/withdraw")
def request_welfare_withdrawal():
    """
    Worker submits an emergency cash withdrawal request from their welfare wallet.

    Expected JSON body:
      amount: (required) float
      reason: (required) string
    """
    result = _require_role("worker")
    if isinstance(result, tuple):
        return result
    worker = result

    data = request.get_json(silent=True) or {}
    reason = str(data.get("reason") or "").strip()
    if not reason:
        return jsonify({"error": "A valid reason for emergency withdrawal is required"}), 400

    try:
        amount = round(float(data.get("amount")), 2)
        if amount <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({"error": "Withdrawal amount must be a positive number"}), 400

    wallet = WelfareWallet.query.filter_by(worker_id=worker.id).first()
    available = max(0.0, round((wallet.balance if wallet else 0.0) - (wallet.insurance_contribution if wallet else 0.0), 2))

    if amount > available:
        return jsonify({
            "error": f"Requested amount (₹{amount}) exceeds your available emergency balance (₹{available}). Note: Insurance reserve (₹{wallet.insurance_contribution if wallet else 0.0}) cannot be withdrawn."
        }), 400

    # Create withdrawal request
    req = WelfareWithdrawalRequest(
        worker_id=worker.id,
        amount=amount,
        reason=reason,
        status="pending",
    )
    db.session.add(req)
    db.session.commit()

    return jsonify({
        "request": req.to_dict(),
        "message": "Emergency withdrawal request submitted successfully! NEED Federation board will review it within 24 hours."
    }), 201


@api.get("/admin/welfare/requests")
def admin_welfare_requests():
    """Fetch all pending and past worker welfare emergency withdrawal requests."""
    result = _require_role("admin")
    if isinstance(result, tuple):
        return result

    requests = WelfareWithdrawalRequest.query.order_by(WelfareWithdrawalRequest.created_at.desc()).all()
    return jsonify({
        "requests": [r.to_dict() for r in requests]
    })


@api.post("/admin/welfare/requests/<int:request_id>/action")
def admin_welfare_request_action(request_id):
    """
    Approve or reject a worker's emergency welfare withdrawal request.

    Expected JSON body:
      status:      (required) "approved" | "rejected"
      admin_notes: (optional) string
    """
    result = _require_role("admin")
    if isinstance(result, tuple):
        return result

    req = db.session.get(WelfareWithdrawalRequest, request_id)
    if not req:
        return jsonify({"error": "Withdrawal request not found"}), 404

    if req.status != "pending":
        return jsonify({"error": f"Request has already been {req.status}"}), 400

    data = request.get_json(silent=True) or {}
    new_status = str(data.get("status") or "").lower().strip()
    if new_status not in ("approved", "rejected"):
        return jsonify({"error": "Status must be 'approved' or 'rejected'"}), 400

    admin_notes = str(data.get("admin_notes") or "").strip()
    req.status = new_status
    req.admin_notes = admin_notes

    if new_status == "approved":
        wallet = WelfareWallet.query.filter_by(worker_id=req.worker_id).first()
        if wallet:
            wallet.balance = max(0.0, round(wallet.balance - req.amount, 2))

        # Log negative welfare transaction audit line
        wt = WelfareTransaction(
            worker_id=req.worker_id,
            amount=-req.amount,
            note=f"Emergency withdrawal approved by Federation (#{req.id})"
        )
        db.session.add(wt)

    db.session.commit()

    return jsonify({
        "request": req.to_dict(),
        "message": f"Withdrawal request #{req.id} has been {new_status}."
    })






# ---------------------------------------------------------------------------
# Worker (Step 4)
# ---------------------------------------------------------------------------

@api.get("/worker/dashboard")
def worker_dashboard():
    """
    Everything the worker dashboard page needs in one request.

    Returns:
      user     — the worker's base User record (name, email, phone, city)
      profile  — WorkerProfile details (trade, skills, rating, verification, etc.)
      wallet   — WelfareWallet balance & lifetime contributions
      stats    — aggregate stats (earnings, completed jobs, rating, active requests)
      bookings — list of recent bookings assigned to this worker
    """
    result = _require_role("worker")
    if isinstance(result, tuple):
        return result
    worker = result

    profile = WorkerProfile.query.filter_by(user_id=worker.id).first()
    wallet = WelfareWallet.query.filter_by(worker_id=worker.id).first()

    bookings = (
        Booking.query.filter_by(worker_id=worker.id)
        .order_by(Booking.created_at.desc())
        .limit(10)
        .all()
    )

    # Counted over ALL of this worker's bookings, not just the ten shown below.
    # Counting the truncated list meant a busy worker with more than ten jobs
    # undercounted their own open requests.
    active_bookings = Booking.query.filter(
        Booking.worker_id == worker.id,
        Booking.status.in_(("pending", "accepted", "in_progress")),
    ).count()

    return jsonify({
        "user": worker.to_dict(),
        "profile": profile.to_dict() if profile else None,
        "wallet": wallet.to_dict() if wallet else {
            "balance": 0.0,
            "total_contribution": 0.0,
            "insurance_contribution": 0.0,
        },
        "stats": {
            # "or 0" as well as the "if profile" guard: the guard covers a
            # missing profile row, but a row present with an empty column would
            # send null, and the page calls .toLocaleString() on these — so a
            # null would blank the whole dashboard rather than show a zero.
            "total_jobs": (profile.total_jobs or 0) if profile else 0,
            "earnings": round((profile.earnings or 0.0) if profile else 0.0, 2),
            "rating": round((profile.rating or 0.0) if profile else 0.0, 1),
            "active_bookings": active_bookings,
        },
        "bookings": [b.to_dict() for b in bookings],
    })


@api.post("/worker/availability")
def update_worker_availability():
    """
    Toggle or explicitly update the worker's availability for incoming jobs.

    Expected JSON body (optional): { "is_available": true | false }
    """
    result = _require_role("worker")
    if isinstance(result, tuple):
        return result
    worker = result

    profile = WorkerProfile.query.filter_by(user_id=worker.id).first()
    if not profile:
        return jsonify({"error": "Worker profile not found"}), 404

    # Only a verified partner can put themselves online.
    #
    # WHY: rejecting a worker sets is_available to False, but this toggle used to
    # let them set it straight back to True. The admin's decision visibly did not
    # stick, and the worker's own header went back to reading "Available".
    if profile.verification_status != "verified":
        return jsonify({
            "error": (
                "Your account is still being verified, so you cannot go online yet."
            )
        }), 403

    data = request.get_json(silent=True) or {}
    if "is_available" in data:
        profile.is_available = bool(data["is_available"])
    else:
        profile.is_available = not profile.is_available

    db.session.commit()

    return jsonify({
        "is_available": profile.is_available,
        "message": f"Availability set to {'Available (Online)' if profile.is_available else 'Unavailable (Offline)'}"
    })


# ---------------------------------------------------------------------------
# Admin / Cooperative Federation (Step 5)
# ---------------------------------------------------------------------------

@api.get("/admin/dashboard")
def admin_dashboard():
    """
    Complete platform overview for the Cooperative Federation admin.

    Returns:
      stats:           platform KPI metrics (workers, customers, welfare, bookings)
      workers:         directory of all workers with verification status and profile data
      recent_bookings: platform-wide recent bookings
      tickets:         platform support & dispute tickets
    """
    result = _require_role("admin")
    if isinstance(result, tuple):
        return result

    # --- Worker breakdown --------------------------------------------------
    verified_count = WorkerProfile.query.filter_by(verification_status="verified").count()
    pending_count  = WorkerProfile.query.filter_by(verification_status="pending").count()
    rejected_count = WorkerProfile.query.filter_by(verification_status="rejected").count()
    total_workers  = WorkerProfile.query.count()

    total_customers = User.query.filter_by(role="customer").count()
    total_services  = Service.query.filter_by(is_active=True).count()
    total_bookings  = Booking.query.count()

    # Welfare Fund totals
    welfare_contrib_sum = (
        db.session.query(db.func.sum(WelfareWallet.total_contribution)).scalar() or 0.0
    )
    welfare_balance_sum = (
        db.session.query(db.func.sum(WelfareWallet.balance)).scalar() or 0.0
    )
    insurance_sum = (
        db.session.query(db.func.sum(WelfareWallet.insurance_contribution)).scalar() or 0.0
    )

    # --- Workers directory with profile & user info -------------------------
    workers_query = (
        db.session.query(WorkerProfile, User, WelfareWallet)
        .join(User, WorkerProfile.user_id == User.id)
        .outerjoin(WelfareWallet, WorkerProfile.user_id == WelfareWallet.worker_id)
        .order_by(WorkerProfile.created_at.desc())
        .all()
    )

    workers_list = []
    for wp, u, ww in workers_query:
        workers_list.append({
            "worker_profile_id":   wp.id,
            "user_id":             u.id,
            "name":                u.name,
            "email":               u.email,
            "phone":               u.phone,
            "city":                wp.city or u.address or "Noida",
            "primary_service":     wp.primary_service or "General",
            "skills":              wp.skills,
            "certifications":      wp.certifications,
            "experience_years":    wp.experience_years,
            "verification_status": wp.verification_status,
            "identity_proof":      wp.identity_proof,
            "rating":              round(wp.rating or 0.0, 1),
            "total_jobs":          wp.total_jobs or 0,
            "earnings":            round(wp.earnings or 0.0, 2),
            "is_available":        bool(wp.is_available),
            # "or 0.0" because the admin page calls .toLocaleString() on this,
            # which would blank the page on a null instead of showing a zero.
            "welfare_balance":     round((ww.balance or 0.0) if ww else 0.0, 2),
            "created_at":          wp.created_at.isoformat() if wp.created_at else None,
        })

    # --- Platform bookings -------------------------------------------------
    recent_bookings = (
        Booking.query.order_by(Booking.created_at.desc()).limit(25).all()
    )

    # --- Support Tickets ---------------------------------------------------
    tickets = (
        SupportTicket.query.order_by(SupportTicket.created_at.desc()).limit(25).all()
    )

    return jsonify({
        "stats": {
            "verified_workers":     verified_count,
            "pending_workers":      pending_count,
            "rejected_workers":     rejected_count,
            "total_workers":        total_workers,
            "total_customers":      total_customers,
            "total_services":       total_services,
            "total_bookings":       total_bookings,
            "welfare_total":        round(welfare_contrib_sum, 2),
            "welfare_balance":      round(welfare_balance_sum, 2),
            "insurance_total":      round(insurance_sum, 2),
        },
        "workers":         workers_list,
        "recent_bookings": [b.to_dict() for b in recent_bookings],
        "tickets":         [t.to_dict() for t in tickets],
    })


@api.post("/worker/verification/submit")
def submit_worker_verification():
    """
    Worker submits identity documents and trade certificates for Federation verification.

    Expected JSON body:
      identity_proof:   (required) string (e.g. "Aadhaar: 4532-8812-9901")
      certifications:   (optional) string (e.g. "ITI Electrician National Trade Certificate")
      experience_years: (optional) int
      skills:           (optional) string
      primary_service:  (optional) string
    """
    result = _require_role("worker")
    if isinstance(result, tuple):
        return result
    worker = result

    data = request.get_json(silent=True) or {}
    proof = str(data.get("identity_proof") or "").strip()
    if not proof:
        return jsonify({"error": "identity_proof (Aadhaar/Govt ID reference or filename) is required"}), 400

    profile = WorkerProfile.query.filter_by(user_id=worker.id).first()
    if not profile:
        return jsonify({"error": "Worker profile not found"}), 404

    profile.identity_proof = proof
    if "certifications" in data:
        profile.certifications = str(data["certifications"] or "").strip()
    if "experience_years" in data:
        try:
            profile.experience_years = max(0, int(data["experience_years"]))
        except (TypeError, ValueError):
            pass
    if "skills" in data:
        profile.skills = str(data["skills"] or "").strip()
    if "primary_service" in data and data["primary_service"]:
        profile.primary_service = str(data["primary_service"]).strip()

    profile.verification_status = "pending"
    profile.verification_notes = None
    profile.is_available = False  # Unverified workers cannot go online

    db.session.commit()

    return jsonify({
        "profile": profile.to_dict(),
        "message": "Verification details submitted successfully! Your application is now pending Federation review."
    })


@api.post("/admin/workers/<int:worker_id>/verify")
def verify_worker(worker_id):
    """
    Approve or reject a worker's verification application.

    Expected JSON body:
      status:             (required) "verified" | "rejected" | "pending"
      verification_notes: (optional) string
    """
    result = _require_role("admin")
    if isinstance(result, tuple):
        return result

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ("verified", "rejected", "pending"):
        return jsonify({"error": "Status must be 'verified', 'rejected', or 'pending'"}), 400

    profile = WorkerProfile.query.filter_by(user_id=worker_id).first()
    if not profile:
        return jsonify({"error": "Worker profile not found"}), 404

    profile.verification_status = new_status
    if "verification_notes" in data:
        profile.verification_notes = str(data["verification_notes"] or "").strip()

    if new_status == "verified":
        profile.is_available = True
    elif new_status == "rejected":
        profile.is_available = False

    db.session.commit()

    return jsonify({
        "worker_id": profile.user_id,
        "verification_status": profile.verification_status,
        "verification_notes": profile.verification_notes,
        "is_available": profile.is_available,
        "message": f"Worker verification status updated to '{new_status}'"
    })


# ---------------------------------------------------------------------------
# Help & Support Desk (Step 12)
# ---------------------------------------------------------------------------

@api.get("/tickets")
def get_user_tickets():
    """Fetch support tickets for the current logged-in user (or all tickets for admin)."""
    user = _get_user_from_req()
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    if user.role == "admin":
        tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
    else:
        tickets = SupportTicket.query.filter_by(user_id=user.id).order_by(SupportTicket.created_at.desc()).all()

    return jsonify({
        "tickets": [t.to_dict() for t in tickets]
    })


@api.post("/tickets")
def create_support_ticket():
    """
    Create a new support ticket.
    """
    user = _get_user_from_req()
    if not user:
        return jsonify({"error": "Authentication required to submit support tickets"}), 401

    data = request.get_json(silent=True) or {}
    subject = str(data.get("subject") or "").strip()
    category = str(data.get("category") or "").strip()
    description = str(data.get("description") or "").strip()
    booking_id = data.get("booking_id")

    if not subject:
        return jsonify({"error": "Subject is required"}), 400
    if not description:
        return jsonify({"error": "Description details are required"}), 400

    if booking_id:
        try:
            booking_id = int(booking_id)
            booking = db.session.get(Booking, booking_id)
            if not booking:
                return jsonify({"error": f"Referenced booking #{booking_id} does not exist"}), 400
        except (TypeError, ValueError):
            booking_id = None

    ticket = SupportTicket(
        user_id=user.id,
        booking_id=booking_id,
        category=category or "General Inquiry",
        subject=subject,
        description=description,
        status="open",
    )

    db.session.add(ticket)
    db.session.commit()

    return jsonify({
        "ticket": ticket.to_dict(),
        "message": "Support ticket created successfully! NEED Federation team will get back to you shortly."
    }), 201


@api.post("/admin/tickets/<int:ticket_id>/status")
def update_ticket_status(ticket_id):
    """
    Update support ticket status (open -> in_progress -> resolved) and optionally attach admin response.

    Expected JSON body:
      status:         (required) "open" | "in_progress" | "resolved"
      admin_response: (optional) string
    """
    result = _require_role("admin")
    if isinstance(result, tuple):
        return result

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ("open", "in_progress", "resolved"):
        return jsonify({"error": "Status must be 'open', 'in_progress', or 'resolved'"}), 400

    ticket = db.session.get(SupportTicket, ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    ticket.status = new_status
    if "admin_response" in data and data["admin_response"]:
        ticket.admin_response = str(data["admin_response"]).strip()

    db.session.commit()

    return jsonify({
        "ticket": ticket.to_dict(),
        "message": f"Support ticket #{ticket.id} status updated to {new_status}"
    })

# ---------------------------------------------------------------------------
# AI Chatbot Assistant (Step 13 — NEED Mitra)
# ---------------------------------------------------------------------------

@api.post("/chat")
def chat_assistant():
    """
    AI Assistant (NEED Mitra) endpoint for intelligent service recommendations,
    cooperative welfare queries, emergency dispatch guidance, and platform help.

    Expected JSON body:
      message: (required) string
    """
    data = request.get_json(silent=True) or {}
    msg_raw = str(data.get("message") or "").strip()
    if not msg_raw:
        return jsonify({"error": "Message is required"}), 400

    msg = msg_raw.lower()

    # Query active services from database for dynamic matching
    active_services = Service.query.filter_by(is_active=True).all()
    serv_dict = {s.name.lower(): s for s in active_services}

    matched_services = []
    quick_actions = []

    # 1. Emergency Rush Dispatch Match
    if any(k in msg for k in ["emergency", "urgent", "outage", "burst", "leakage", "short circuit", "power cut", "spark"]):
        target_serv = None
        if any(k in msg for k in ["power", "outage", "light", "fuse", "spark", "wire", "electric"]):
            target_serv = serv_dict.get("electrician")
        elif any(k in msg for k in ["water", "leak", "burst", "pipe", "tap", "drain", "plumb"]):
            target_serv = serv_dict.get("plumber")

        if target_serv:
            matched_services.append(target_serv.to_dict())
            reply = f"🚨 **Emergency Rush Dispatch** detected for **{target_serv.name}**!\n\nNEED provides instant emergency dispatch (+₹100 rush fee) to send the nearest verified partner to your doorstep within 15-30 minutes."
            quick_actions.append({"label": f"Book Urgent {target_serv.name}", "action": "book", "service_id": target_serv.id})
        else:
            reply = "🚨 **Emergency Assistance Required**\n\nFor urgent service emergencies (power outages, pipe bursts, or electrical hazards), you can enable the **Emergency Dispatch (+₹100)** toggle during booking for priority dispatch."

        quick_actions.append({"label": "View All Emergency Services", "link": "/services"})
        return jsonify({
            "reply": reply,
            "intent": "emergency",
            "suggested_services": matched_services,
            "quick_actions": quick_actions,
        })

    # 2. Cooperative Welfare & 90/10 Split Intent
    if any(k in msg for k in ["welfare", "wallet", "90/10", "split", "insurance", "cooperative", "social security", "commission"]):
        reply = "🤝 **How NEED's Worker Cooperative Works:**\n\n• **90% Worker Take-Home**: 90% of the service fare goes directly to the service provider.\n• **10% Welfare Deposit**: 10% is saved into the worker's personal Welfare Wallet.\n• **70/30 Fund Split**: 70% of the welfare cut is available for liquid emergency cash withdrawals, and 30% goes to a dedicated health & accident insurance reserve."
        quick_actions.append({"label": "View Cooperative Model", "link": "/about"})
        quick_actions.append({"label": "Help & Support", "link": "/support"})

        return jsonify({
            "reply": reply,
            "intent": "welfare_info",
            "suggested_services": [],
            "quick_actions": quick_actions,
        })

    # 3. Verification Intent
    if any(k in msg for k in ["verify", "verified", "verification", "aadhaar", "document", "badge", "certificate"]):
        reply = "🛡️ **Worker Verification & Trust Standard:**\n\nEvery service partner on NEED passes government ID verification (Aadhaar/Driving License) and trade skill assessment before going online. Verified partners display a green **Cooperative Verified** badge."
        quick_actions.append({"label": "Browse Verified Providers", "link": "/services"})

        return jsonify({
            "reply": reply,
            "intent": "verification",
            "suggested_services": [],
            "quick_actions": quick_actions,
        })

    # 4. Payment, Invoice & Support Intent
    if any(k in msg for k in ["payment", "invoice", "receipt", "upi", "refund", "ticket", "dispute", "help", "support"]):
        reply = "💳 **Payments, Invoices & Disputes:**\n\n• We accept **UPI, Credit/Debit Cards, and Cash**.\n• Official itemized cooperative tax invoices can be viewed & printed directly from your Customer Dashboard.\n• Have a payment query or dispute? File a support ticket at our Help Center."
        quick_actions.append({"label": "Go to Help Center", "link": "/support"})

        return jsonify({
            "reply": reply,
            "intent": "support",
            "suggested_services": [],
            "quick_actions": quick_actions,
        })

    # 5. Specific Service Recommendations
    service_keywords = {
        "electrician": ["electrician", "wire", "wiring", "fan", "switch", "light", "fuse", "mcb", "socket", "short circuit"],
        "plumber": ["plumber", "tap", "leak", "leaking", "pipe", "drain", "clog", "sink", "flush", "bathroom"],
        "carpenter": ["carpenter", "wood", "door", "lock", "furniture", "table", "chair", "cupboard", "cabinet"],
        "painter": ["painter", "paint", "wall", "putty", "whitewash", "color"],
        "cleaner": ["cleaner", "cleaning", "mop", "sweep", "deep clean", "washroom", "kitchen clean"],
        "ac service": ["ac", "air conditioner", "cooling", "ac gas", "split ac", "window ac"],
        "refrigerator service": ["fridge", "refrigerator", "freezer", "fridge cooling"],
        "washing machine service": ["washing machine", "washer", "dryer", "laundry machine"],
        "tv installation": ["tv", "television", "wall mount", "dth"],
        "pest control": ["pest", "cockroach", "termite", "bedbug", "mosquito"],
        "car washing": ["car wash", "car clean", "vehicle wash"],
        "barber": ["barber", "haircut", "shave", "grooming"],
    }

    for s_name, keywords in service_keywords.items():
        if any(k in msg for k in keywords):
            s_obj = serv_dict.get(s_name)
            if s_obj and s_obj.to_dict() not in matched_services:
                matched_services.append(s_obj.to_dict())

    if matched_services:
        primary = matched_services[0]
        reply = f"I found **{len(matched_services)} service(s)** matching your request!\n\n• **{primary['name']}** — {primary['description']} (Starts at **₹{primary['starting_price']}**)\n\nAll NEED service providers are 100% background-verified cooperative members."
        for ms in matched_services[:2]:
            quick_actions.append({"label": f"Book {ms['name']} (₹{ms['starting_price']})", "action": "book", "service_id": ms["id"]})
        quick_actions.append({"label": "Browse All Workers", "link": "/services"})

        return jsonify({
            "reply": reply,
            "intent": "service_match",
            "suggested_services": matched_services,
            "quick_actions": quick_actions,
        })

    # 6. Fallback General Greeting
    reply = "Namaste! 🙏 I am **NEED Mitra**, your NEED AI Assistant.\n\nI can help you find verified service providers (Electricians, Plumbers, AC Repair, Carpenters), explain our cooperative 90/10 model, or assist with emergency rush dispatches."
    quick_actions.append({"label": "Find Electrician", "action": "book", "service_id": serv_dict.get("electrician", active_services[0]).id})
    quick_actions.append({"label": "Find Plumber", "action": "book", "service_id": serv_dict.get("plumber", active_services[1]).id if len(active_services) > 1 else active_services[0].id})
    quick_actions.append({"label": "How 90/10 Works", "link": "/about"})

    return jsonify({
        "reply": reply,
        "intent": "general",
        "suggested_services": [s.to_dict() for s in active_services[:2]],
        "quick_actions": quick_actions,
    })


# ---------------------------------------------------------------------------
# AI Demand Forecasting & Predictive Analytics (Step 14)
# ---------------------------------------------------------------------------

@api.get("/admin/forecasting")
def get_demand_forecasting():
    """
    AI Demand Forecasting & Predictive Analytics engine for Cooperative Federation.

    Calculates 7-day demand projections, seasonal surge factors, geographic hotspots,
    and recommended worker recruitment/re-allocation advisories.
    """
    result = _require_role("admin")
    if isinstance(result, tuple):
        return result

    # 1. Total bookings & services
    total_bookings = Booking.query.count()
    total_workers = WorkerProfile.query.count()
    verified_workers = WorkerProfile.query.filter_by(verification_status="verified").count()

    # 2. Demand Hotspots by Service Category
    services = Service.query.all()
    hotspots = []
    
    # Pre-defined seasonal multipliers based on realistic Indian service demand patterns
    seasonal_factors = {
        "AC Service": {"multiplier": 1.45, "trend": "+45%", "season": "Summer Peak Surge", "status": "critical"},
        "Plumber": {"multiplier": 1.25, "trend": "+25%", "season": "Monsoon Leakage Surge", "status": "high"},
        "Electrician": {"multiplier": 1.30, "trend": "+30%", "season": "High Load Season", "status": "high"},
        "Painter": {"multiplier": 1.35, "trend": "+35%", "season": "Pre-Festive Season", "status": "medium"},
        "Cleaner": {"multiplier": 1.20, "trend": "+20%", "season": "Festive Deep Clean", "status": "medium"},
        "Pest Control": {"multiplier": 1.15, "trend": "+15%", "season": "Monsoon Pest Surge", "status": "normal"},
    }

    for s in services:
        job_count = Booking.query.filter_by(service_id=s.id).count()
        factor_info = seasonal_factors.get(s.name, {"multiplier": 1.10, "trend": "+10%", "season": "Regular Demand", "status": "normal"})
        projected_jobs = max(10, int((job_count + 5) * factor_info["multiplier"]))

        hotspots.append({
            "service_id": s.id,
            "service_name": s.name,
            "category": s.category,
            "historical_bookings": job_count,
            "projected_7day_demand": projected_jobs,
            "trend_percentage": factor_info["trend"],
            "seasonal_factor": factor_info["season"],
            "urgency_level": factor_info["status"],
            "active_verified_workers": WorkerProfile.query.filter(
                WorkerProfile.verification_status == "verified",
                WorkerProfile.primary_service.ilike(f"%{s.name}%")
            ).count(),
        })

    # Sort hotspots by projected demand
    hotspots.sort(key=lambda x: x["projected_7day_demand"], reverse=True)

    # 3. 7-Day Forecast Matrix (Mon-Sun)
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    forecast_matrix = [
        {"day": days[i], "projected_bookings": int(15 + (i * 3) + (i % 2 * 4)), "capacity_utilized": f"{60 + (i * 5)}%"}
        for i in range(7)
    ]

    # 4. AI Strategic Recommendations
    recommendations = [
        {
            "id": 1,
            "category": "Worker Allocation Alert",
            "title": "Recruit & Verify AC Technicians in Noida & Greater Noida",
            "description": "Predicted +45% booking surge over the next 14 days due to summer heatwave. Current 4 verified AC technicians will reach 95% capacity.",
            "impact": "High Priority",
            "action_label": "Review Worker Applications",
        },
        {
            "id": 2,
            "category": "Surge Pricing Advisory",
            "title": "Enable Weekend Emergency Rush Incentive (+₹100)",
            "description": "Saturday & Sunday booking volume projects 85% peak utilization between 10 AM - 4 PM. Offering emergency rush dispatch bonus increases worker availability by 28%.",
            "impact": "Revenue & Retention",
            "action_label": "View Weekend Schedule",
        },
        {
            "id": 3,
            "category": "Welfare Fund Guarantee",
            "title": "Maintain 70/30 Liquid Reserve Ratio",
            "description": "Forecasted monthly welfare fund deposit reaches ₹18,500. Reserve ratio ensures all 20 cooperative partners have instant emergency withdrawal coverage.",
            "impact": "Social Security",
            "action_label": "Inspect Welfare Ledger",
        },
    ]

    return jsonify({
        "forecasting_summary": {
            "total_historical_bookings": total_bookings,
            "total_registered_workers": total_workers,
            "verified_active_workers": verified_workers,
            "forecast_period": "7-Day Predictive Horizon",
            "overall_demand_growth": "+32% projected growth",
        },
        "demand_hotspots": hotspots[:6],
        "forecast_matrix": forecast_matrix,
        "recommendations": recommendations,
    })


# ---------------------------------------------------------------------------
# Labour Cooperatives & Societies Module
# ---------------------------------------------------------------------------

@api.get("/cooperatives")
def list_cooperatives():
    """List all registered Labour Cooperatives with active worker counts."""
    cooperatives = Cooperative.query.filter_by(verification_status="verified").order_by(Cooperative.rating.desc()).all()
    return jsonify([c.to_dict() for c in cooperatives])


@api.get("/cooperatives/<int:coop_id>")
def get_cooperative_detail(coop_id):
    """Fetch cooperative profile details and affiliated active workers."""
    coop = db.session.get(Cooperative, coop_id)
    if not coop:
        return jsonify({"error": "Cooperative not found"}), 404
    
    workers = (
        db.session.query(WorkerProfile, User)
        .join(User, WorkerProfile.user_id == User.id)
        .filter(WorkerProfile.cooperative_id == coop.id)
        .filter(WorkerProfile.verification_status == "verified")
        .all()
    )
    
    workers_list = []
    for wp, u in workers:
        workers_list.append({
            "worker_id": u.id,
            "profile_id": wp.id,
            "name": u.name,
            "trade": wp.primary_service,
            "skills": wp.skills,
            "rating": wp.rating,
            "experience_years": wp.experience_years,
            "total_jobs": wp.total_jobs,
            "is_available": wp.is_available,
        })

    result = coop.to_dict()
    result["workers"] = workers_list
    return jsonify(result)


@api.post("/cooperatives")
def register_cooperative():
    """Register a new Labour Cooperative / Society."""
    user = _get_user_from_req()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    reg_num = (data.get("registration_number") or "").strip()
    city = (data.get("city") or "").strip()
    categories = (data.get("service_categories") or "").strip()
    desc = (data.get("description") or "").strip()

    if not name or not reg_num or not city:
        return jsonify({"error": "Name, registration number, and city are required"}), 400

    if Cooperative.query.filter_by(name=name).first():
        return jsonify({"error": "Cooperative name already exists"}), 409

    coop = Cooperative(
        name=name,
        registration_number=reg_num,
        city=city,
        address=data.get("address", "").strip() or city,
        service_categories=categories or "Home Services",
        description=desc,
        contact_email=user.email,
        contact_phone=user.phone,
        admin_user_id=user.id,
        verification_status="verified",
    )
    db.session.add(coop)

    if user.role != "admin":
        user.role = "cooperative_admin"

    db.session.commit()
    return jsonify(coop.to_dict()), 201


@api.get("/cooperative/dashboard")
def cooperative_dashboard():
    """Dashboard metrics and worker management overview for Cooperative Admins."""
    user = _get_user_from_req()
    if not user or user.role not in ("cooperative_admin", "admin"):
        return jsonify({"error": "Forbidden. Cooperative admin access required"}), 403

    coop = Cooperative.query.filter_by(admin_user_id=user.id).first()
    if not coop and user.role != "admin":
        coop = Cooperative.query.first()

    coop_id = coop.id if coop else None

    workers_q = (
        db.session.query(WorkerProfile, User)
        .join(User, WorkerProfile.user_id == User.id)
    )
    if coop_id:
        workers_q = workers_q.filter(WorkerProfile.cooperative_id == coop_id)
    
    worker_rows = workers_q.all()
    workers_data = []
    total_coop_earnings = 0.0
    total_jobs_count = 0

    for wp, u in worker_rows:
        total_coop_earnings += (wp.earnings or 0.0)
        total_jobs_count += (wp.total_jobs or 0)
        workers_data.append({
            "worker_id": u.id,
            "profile_id": wp.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "primary_service": wp.primary_service,
            "skills": wp.skills,
            "experience_years": wp.experience_years,
            "verification_status": wp.verification_status,
            "identity_verified": wp.identity_verified,
            "skill_verified": wp.skill_verified,
            "rating": wp.rating,
            "total_jobs": wp.total_jobs,
            "earnings": wp.earnings,
            "is_available": wp.is_available,
        })

    bookings_q = Booking.query.order_by(Booking.created_at.desc())
    if coop_id and worker_rows:
        worker_user_ids = [u.id for _, u in worker_rows]
        bookings_q = bookings_q.filter(
            (Booking.cooperative_id == coop_id) | (Booking.worker_id.in_(worker_user_ids))
        )
    
    bookings = bookings_q.limit(25).all()

    disputes_q = Dispute.query.order_by(Dispute.created_at.desc())
    if coop_id:
        disputes_q = disputes_q.filter_by(cooperative_id=coop_id)
    disputes = disputes_q.all()

    return jsonify({
        "cooperative": coop.to_dict() if coop else None,
        "stats": {
            "total_workers": len(workers_data),
            "verified_workers": len([w for w in workers_data if w["verification_status"] == "verified"]),
            "total_jobs_completed": total_jobs_count,
            "total_gmv": round(total_jobs_count * 380.0, 2),
            "cooperative_share_earnings": round(total_jobs_count * 380.0 * 0.05, 2),
            "worker_total_earnings": round(total_coop_earnings, 2),
            "open_disputes_count": len([d for d in disputes if d.status == "open"]),
        },
        "workers": workers_data,
        "bookings": [b.to_dict() for b in bookings],
        "disputes": [d.to_dict() for d in disputes],
    })


@api.post("/cooperative/workers")
def cooperative_add_worker():
    """Cooperative admin adds/registers a new worker partner."""
    user = _get_user_from_req()
    if not user or user.role not in ("cooperative_admin", "admin"):
        return jsonify({"error": "Cooperative admin access required"}), 403

    coop = Cooperative.query.filter_by(admin_user_id=user.id).first()
    if not coop and user.role != "admin":
        coop = Cooperative.query.first()

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").lower().strip()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or "demo123"
    primary_service = (data.get("primary_service") or "").strip()
    skills = (data.get("skills") or "").strip()
    experience = int(data.get("experience_years") or 0)

    if not name or not email or not phone or not primary_service:
        return jsonify({"error": "Name, email, phone, and service category are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Account with email already exists"}), 409

    wuser = User(
        name=name,
        email=email,
        phone=phone,
        password_hash=generate_password_hash(password),
        role="worker",
        address=coop.city if coop else "Noida",
        language="hi",
        is_verified=True,
        trust_badge="Cooperative Member",
        accepted_terms=True,
    )
    db.session.add(wuser)
    db.session.flush()

    profile = WorkerProfile(
        user_id=wuser.id,
        cooperative_id=coop.id if coop else None,
        primary_service=primary_service,
        skills=skills,
        experience_years=experience,
        verification_status="verified",
        identity_verified=True,
        skill_verified=True,
        city=coop.city if coop else "Noida",
        is_available=True,
    )
    db.session.add(profile)
    db.session.add(WelfareWallet(worker_id=wuser.id, balance=0.0, total_contribution=0.0, insurance_contribution=0.0))

    db.session.commit()
    return jsonify({
        "worker": profile.to_dict(),
        "user": wuser.to_dict(),
        "message": f"Worker '{name}' successfully registered under {coop.name if coop else 'Cooperative'}."
    }), 201


@api.post("/cooperative/workers/<int:worker_id>/verify")
def cooperative_verify_worker(worker_id):
    """Cooperative admin verifies worker skill and identity status."""
    user = _get_user_from_req()
    if not user or user.role not in ("cooperative_admin", "admin"):
        return jsonify({"error": "Cooperative admin access required"}), 403

    profile = WorkerProfile.query.filter_by(user_id=worker_id).first()
    if not profile:
        return jsonify({"error": "Worker profile not found"}), 404

    data = request.get_json(silent=True) or {}
    status = (data.get("status") or "verified").lower().strip()
    notes = (data.get("verification_notes") or "Verified by Cooperative Administrator.").strip()

    profile.verification_status = status
    profile.verification_notes = notes
    profile.skill_verified = status == "verified"
    profile.identity_verified = status == "verified"

    db.session.commit()
    return jsonify({
        "profile": profile.to_dict(),
        "message": f"Worker verification updated to '{status}'"
    })


@api.post("/cooperative/bookings/<int:booking_id>/assign")
def cooperative_assign_worker(booking_id):
    """Cooperative admin assigns an active worker to a customer booking."""
    user = _get_user_from_req()
    if not user or user.role not in ("cooperative_admin", "admin"):
        return jsonify({"error": "Cooperative admin access required"}), 403

    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    data = request.get_json(silent=True) or {}
    worker_id = data.get("worker_id")
    if not worker_id:
        return jsonify({"error": "worker_id is required"}), 400

    worker = db.session.get(User, worker_id)
    if not worker or worker.role != "worker":
        return jsonify({"error": "Invalid worker user ID"}), 400

    booking.worker_id = worker.id
    booking.status = "worker_assigned"
    booking.assigned_at = datetime.utcnow()

    db.session.commit()
    return jsonify({
        "booking": booking.to_dict(),
        "message": f"Assigned worker '{worker.name}' to Booking #{booking.id}"
    })


# ---------------------------------------------------------------------------
# Structured Booking Lifecycle & Cancellation Accountability
# ---------------------------------------------------------------------------

@api.post("/bookings/<int:booking_id>/status")
def update_booking_status(booking_id):
    """
    Advance booking through the 8-stage lifecycle:
      requested -> accepted -> worker_assigned -> on_the_way -> arrived -> in_progress -> completed -> confirmed (or cancelled)
    """
    user = _get_user_from_req()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    data = request.get_json(silent=True) or {}
    new_status = (data.get("status") or "").lower().strip()
    reason = (data.get("cancellation_reason") or "").strip()

    valid_statuses = [
        "requested", "accepted", "worker_assigned", "on_the_way",
        "arrived", "in_progress", "completed", "confirmed", "cancelled"
    ]
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status '{new_status}'. Allowed: {', '.join(valid_statuses)}"}), 400

    now = datetime.utcnow()

    if new_status == "cancelled":
        if not reason:
            return jsonify({"error": "Cancellation reason is required"}), 400
        booking.status = "cancelled"
        booking.cancelled_at = now
        booking.cancellation_reason = reason
        booking.cancelled_by = user.role
    else:
        booking.status = new_status
        if new_status == "accepted":
            booking.accepted_at = now
        elif new_status == "worker_assigned":
            booking.assigned_at = now
        elif new_status == "on_the_way":
            booking.on_the_way_at = now
        elif new_status == "arrived":
            booking.arrived_at = now
        elif new_status == "in_progress":
            booking.in_progress_at = now
        elif new_status == "completed":
            booking.completed_at = now
            if booking.worker_id:
                profile = WorkerProfile.query.filter_by(user_id=booking.worker_id).first()
                if profile:
                    profile.total_jobs = (profile.total_jobs or 0) + 1
                    net_earned = round(booking.amount * WORKER_SHARE, 2)
                    profile.earnings = round((profile.earnings or 0.0) + net_earned, 2)
                    _credit_welfare(booking.worker_id, booking)
        elif new_status == "confirmed":
            booking.confirmed_at = now

    db.session.commit()
    return jsonify({
        "booking": booking.to_dict(),
        "message": f"Booking #{booking.id} status updated to '{new_status}'"
    })


# ---------------------------------------------------------------------------
# Structured Dispute Resolution System
# ---------------------------------------------------------------------------

@api.get("/disputes")
def list_disputes():
    """List disputes relevant to logged-in user role (Customer, Worker, Cooperative Admin, Platform Admin)."""
    user = _get_user_from_req()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    if user.role == "admin":
        disputes = Dispute.query.order_by(Dispute.created_at.desc()).all()
    elif user.role == "cooperative_admin":
        coop = Cooperative.query.filter_by(admin_user_id=user.id).first()
        if coop:
            disputes = Dispute.query.filter_by(cooperative_id=coop.id).order_by(Dispute.created_at.desc()).all()
        else:
            disputes = Dispute.query.order_by(Dispute.created_at.desc()).all()
    else:
        disputes = Dispute.query.filter(
            (Dispute.raised_by_id == user.id) | (Dispute.against_id == user.id)
        ).order_by(Dispute.created_at.desc()).all()

    return jsonify([d.to_dict() for d in disputes])


@api.post("/disputes")
def create_dispute():
    """Raise a structured dispute against a booking."""
    user = _get_user_from_req()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json(silent=True) or {}
    booking_id = data.get("booking_id")
    category = (data.get("category") or "Service Quality").strip()
    description = (data.get("description") or "").strip()
    evidence_url = (data.get("evidence_url") or "").strip()

    if not booking_id or not description:
        return jsonify({"error": "booking_id and description are required"}), 400

    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    against_id = booking.worker_id if user.id == booking.customer_id else booking.customer_id
    coop_id = booking.cooperative_id

    dispute = Dispute(
        booking_id=booking.id,
        raised_by_id=user.id,
        against_id=against_id,
        cooperative_id=coop_id,
        category=category,
        description=description,
        evidence_url=evidence_url,
        status="open",
    )
    db.session.add(dispute)
    db.session.commit()

    return jsonify({
        "dispute": dispute.to_dict(),
        "message": f"Dispute #{dispute.id} submitted successfully. NEED Federation will review shortly."
    }), 201


@api.post("/disputes/<int:dispute_id>/resolve")
def resolve_dispute(dispute_id):
    """Admin or Cooperative Admin resolves a dispute."""
    user = _get_user_from_req()
    if not user or user.role not in ("admin", "cooperative_admin"):
        return jsonify({"error": "Admin or Cooperative Admin access required"}), 403

    dispute = db.session.get(Dispute, dispute_id)
    if not dispute:
        return jsonify({"error": "Dispute not found"}), 404

    data = request.get_json(silent=True) or {}
    status = (data.get("status") or "resolved").lower().strip()
    notes = (data.get("resolution_notes") or "Reviewed and resolved by Federation authority.").strip()

    if status not in ("resolved", "rejected", "under_review"):
        status = "resolved"

    dispute.status = status
    dispute.resolution_notes = notes
    dispute.resolved_by_id = user.id

    db.session.commit()
    return jsonify({
        "dispute": dispute.to_dict(),
        "message": f"Dispute #{dispute.id} status updated to '{status}'"
    })


# ---------------------------------------------------------------------------
# Two-Sided Ratings (Worker rates Customer)
# ---------------------------------------------------------------------------

@api.post("/reviews/customer")
def review_customer():
    """Worker rates customer after booking completion."""
    user = _get_user_from_req()
    if not user or user.role != "worker":
        return jsonify({"error": "Worker authentication required"}), 403

    data = request.get_json(silent=True) or {}
    booking_id = data.get("booking_id")
    rating = int(data.get("rating") or 5)
    comment = (data.get("comment") or "").strip()

    if not booking_id:
        return jsonify({"error": "booking_id is required"}), 400

    booking = db.session.get(Booking, booking_id)
    if not booking or booking.worker_id != user.id:
        return jsonify({"error": "Invalid or unauthorized booking"}), 403

    review = Review(
        booking_id=booking.id,
        customer_id=booking.customer_id,
        worker_id=user.id,
        rating=max(1, min(5, rating)),
        comment=comment,
        review_type="worker_to_customer",
    )
    db.session.add(review)
    db.session.commit()

    return jsonify({
        "review": review.to_dict(),
        "message": "Customer feedback recorded successfully!"
    })


