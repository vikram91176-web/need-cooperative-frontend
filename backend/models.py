"""
models.py — the database tables for NEED.

WHAT: Each Python class below becomes one table in SQLite.
WHY:  SQLAlchemy lets us describe tables as classes, so we write Python
      instead of raw SQL. Easier to read and explain.
HOW:  `db.Model` is the base class. Each `db.Column` is one column.

All tables are defined in this single file on purpose — for a project of this
size it is much easier to explain "here is my whole database" than to hunt
through many files.
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

# One shared database object, created here and connected to the app in app.py.
db = SQLAlchemy()


class Cooperative(db.Model):
    """A Labour Cooperative / Society registered on the NEED platform."""

    __tablename__ = "cooperatives"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    registration_number = db.Column(db.String(80), unique=True)  # e.g. "COOP-DL-2024-8842"
    verification_status = db.Column(db.String(20), default="verified")  # verified / pending / rejected
    city = db.Column(db.String(80))
    address = db.Column(db.String(255))
    service_categories = db.Column(db.String(255))  # e.g. "Electrician, Plumbing, AC Repair"
    description = db.Column(db.Text)
    contact_email = db.Column(db.String(120))
    contact_phone = db.Column(db.String(20))

    # User ID of the Cooperative Administrator
    admin_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    rating = db.Column(db.Float, default=4.8)
    verification_badge = db.Column(db.String(80), default="Government Registered Cooperative")
    platform_fee_percent = db.Column(db.Float, default=10.0)
    cooperative_fee_percent = db.Column(db.Float, default=5.0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    admin_user = db.relationship("User", foreign_keys=[admin_user_id], lazy="joined")
    workers = db.relationship("WorkerProfile", back_populates="cooperative", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "registration_number": self.registration_number,
            "verification_status": self.verification_status,
            "city": self.city,
            "address": self.address,
            "service_categories": self.service_categories,
            "description": self.description,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "admin_user_id": self.admin_user_id,
            "admin_name": self.admin_user.name if self.admin_user else "Cooperative Admin",
            "rating": round(self.rating or 4.8, 1),
            "verification_badge": self.verification_badge,
            "platform_fee_percent": self.platform_fee_percent,
            "cooperative_fee_percent": self.cooperative_fee_percent,
            "active_worker_count": len([w for w in self.workers if w.verification_status == "verified"]) if self.workers else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class User(db.Model):
    """Every person who logs in: customer, worker, cooperative_admin, or platform admin."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), unique=True, nullable=False)

    password_hash = db.Column(db.String(255), nullable=False)

    # "customer", "worker", "cooperative_admin", "admin"
    role = db.Column(db.String(30), nullable=False, default="customer")

    address = db.Column(db.String(255))
    gender = db.Column(db.String(20))
    language = db.Column(db.String(10), default="en")

    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    # Two-sided trust & verification
    is_verified = db.Column(db.Boolean, default=True)
    trust_badge = db.Column(db.String(80), default="Verified Member")

    accepted_terms = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    worker_profile = db.relationship(
        "WorkerProfile", back_populates="user", uselist=False
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "address": self.address,
            "gender": self.gender,
            "language": self.language,
            "is_verified": self.is_verified,
            "trust_badge": self.trust_badge,
        }


class WorkerProfile(db.Model):
    """Extra information that service providers (workers) have."""

    __tablename__ = "worker_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Labour Cooperative Association
    cooperative_id = db.Column(db.Integer, db.ForeignKey("cooperatives.id"))

    skills = db.Column(db.String(255))
    certifications = db.Column(db.String(255))
    experience_years = db.Column(db.Integer, default=0)

    # Verification badges & checks
    verification_status = db.Column(db.String(20), default="pending")  # pending/verified/rejected
    identity_verified = db.Column(db.Boolean, default=True)
    skill_verified = db.Column(db.Boolean, default=True)
    identity_proof = db.Column(db.String(255))
    verification_notes = db.Column(db.Text)

    rating = db.Column(db.Float, default=0.0)
    total_jobs = db.Column(db.Integer, default=0)
    earnings = db.Column(db.Float, default=0.0)

    service_radius_km = db.Column(db.Integer, default=10)
    is_available = db.Column(db.Boolean, default=True)

    primary_service = db.Column(db.String(80))
    city = db.Column(db.String(80))
    photo_url = db.Column(db.String(255))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="worker_profile")
    cooperative = db.relationship("Cooperative", back_populates="workers")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "skills": self.skills,
            "certifications": self.certifications,
            "experience_years": self.experience_years,
            "verification_status": self.verification_status,
            "identity_verified": self.identity_verified,
            "skill_verified": self.skill_verified,
            "identity_proof": self.identity_proof,
            "verification_notes": self.verification_notes,
            "cooperative_id": self.cooperative_id,
            "cooperative_name": self.cooperative.name if self.cooperative else "Independent Member Cooperative",
            "rating": round(self.rating or 0.0, 1),
            "total_jobs": self.total_jobs or 0,
            "earnings": round(self.earnings or 0.0, 2),
            "service_radius_km": self.service_radius_km,
            "is_available": self.is_available,
            "primary_service": self.primary_service,
            "city": self.city,
            "photo_url": self.photo_url,
        }


class Service(db.Model):
    """The list of services customers can book."""

    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    category = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(255))
    starting_price = db.Column(db.Float, nullable=False)
    icon = db.Column(db.String(40), default="wrench")
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "starting_price": self.starting_price,
            "icon": self.icon,
        }


class Booking(db.Model):
    """One service request made by a customer."""

    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    cooperative_id = db.Column(db.Integer, db.ForeignKey("cooperatives.id"))
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)

    scheduled_date = db.Column(db.String(20))
    scheduled_time = db.Column(db.String(20))
    address = db.Column(db.String(255))
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))

    is_emergency = db.Column(db.Boolean, default=False)
    amount = db.Column(db.Float, default=0.0)

    # Lifecycle: requested -> accepted -> worker_assigned -> on_the_way -> arrived -> in_progress -> completed -> confirmed (or cancelled)
    status = db.Column(db.String(30), default="requested")

    # Timestamps for complete lifecycle accountability
    accepted_at = db.Column(db.DateTime)
    assigned_at = db.Column(db.DateTime)
    on_the_way_at = db.Column(db.DateTime)
    arrived_at = db.Column(db.DateTime)
    in_progress_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    confirmed_at = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)

    # Cancellation accountability
    cancellation_reason = db.Column(db.Text)
    cancelled_by = db.Column(db.String(20))  # "customer", "worker", "cooperative", "admin"

    completion_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    service     = db.relationship("Service",     foreign_keys=[service_id],     lazy="joined")
    worker      = db.relationship("User",        foreign_keys=[worker_id],      lazy="joined")
    customer    = db.relationship("User",        foreign_keys=[customer_id],    lazy="joined")
    cooperative = db.relationship("Cooperative", foreign_keys=[cooperative_id], lazy="joined")
    payment     = db.relationship("Payment",     backref="booking", uselist=False, lazy="joined")
    review_rel  = db.relationship("Review",      foreign_keys="Review.booking_id", uselist=False, lazy="joined")

    def to_dict(self):
        return {
            "id":                  self.id,
            "service_id":          self.service_id,
            "service_name":        self.service.name if self.service else None,
            "customer_id":         self.customer_id,
            "customer_name":       self.customer.name if self.customer else "Customer",
            "worker_id":           self.worker_id,
            "worker_name":         self.worker.name if self.worker else "Pending Worker Assignment",
            "cooperative_id":      self.cooperative_id,
            "cooperative_name":    self.cooperative.name if self.cooperative else (self.worker.worker_profile.cooperative.name if (self.worker and self.worker.worker_profile and self.worker.worker_profile.cooperative) else "NEED Cooperative Federation"),
            "scheduled_date":      self.scheduled_date,
            "scheduled_time":      self.scheduled_time,
            "address":             self.address,
            "is_emergency":        self.is_emergency,
            "amount":              self.amount,
            "status":              self.status,
            "accepted_at":         self.accepted_at.isoformat() if self.accepted_at else None,
            "on_the_way_at":       self.on_the_way_at.isoformat() if self.on_the_way_at else None,
            "arrived_at":          self.arrived_at.isoformat() if self.arrived_at else None,
            "in_progress_at":      self.in_progress_at.isoformat() if self.in_progress_at else None,
            "completed_at":        self.completed_at.isoformat() if self.completed_at else None,
            "confirmed_at":        self.confirmed_at.isoformat() if self.confirmed_at else None,
            "cancelled_at":        self.cancelled_at.isoformat() if self.cancelled_at else None,
            "cancellation_reason": self.cancellation_reason,
            "cancelled_by":        self.cancelled_by,
            "completion_note":     self.completion_note,
            "is_paid":             bool(self.payment and self.payment.status == "successful"),
            "invoice_id":          self.payment.invoice_id if self.payment else None,
            "payment_method":      self.payment.method if self.payment else None,
            "payment_breakdown":   self.payment.to_dict() if self.payment else None,
            "review":              self.review_rel.to_dict() if self.review_rel else None,
            "created_at":          self.created_at.isoformat() if self.created_at else None,
        }


class Payment(db.Model):
    """Payment record with transparent fee breakdown."""

    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    method = db.Column(db.String(20))   # "upi", "card", "cash"
    status = db.Column(db.String(20), default="pending")
    invoice_id = db.Column(db.String(40), unique=True)
    
    # Transparent Fee Breakdown
    platform_fee = db.Column(db.Float, default=0.0)      # e.g., 10%
    cooperative_share = db.Column(db.Float, default=0.0)  # e.g., 5%
    worker_earnings = db.Column(db.Float, default=0.0)    # e.g., 85%
    welfare_contribution = db.Column(db.Float, default=0.0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "amount": round(self.amount or 0.0, 2),
            "method": self.method,
            "status": self.status,
            "invoice_id": self.invoice_id,
            "platform_fee": round(self.platform_fee or (self.amount * 0.10), 2),
            "cooperative_share": round(self.cooperative_share or (self.amount * 0.05), 2),
            "worker_earnings": round(self.worker_earnings or (self.amount * 0.85), 2),
            "welfare_contribution": round(self.welfare_contribution or 0.0, 2),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class WelfareWallet(db.Model):
    """A worker's welfare savings, funded by a small share of each job."""

    __tablename__ = "welfare_wallets"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    balance = db.Column(db.Float, default=0.0)
    total_contribution = db.Column(db.Float, default=0.0)
    insurance_contribution = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "worker_id": self.worker_id,
            "balance": round(self.balance or 0.0, 2),
            "total_contribution": round(self.total_contribution or 0.0, 2),
            "insurance_contribution": round(self.insurance_contribution or 0.0, 2),
        }


class WelfareTransaction(db.Model):
    """One line in the welfare wallet history."""

    __tablename__ = "welfare_transactions"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"))
    amount = db.Column(db.Float, nullable=False)
    note = db.Column(db.String(140))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "worker_id": self.worker_id,
            "booking_id": self.booking_id,
            "amount": round(self.amount or 0.0, 2),
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class WelfareWithdrawalRequest(db.Model):
    """An emergency cash withdrawal request submitted by a worker from their welfare wallet."""

    __tablename__ = "welfare_withdrawal_requests"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="pending")
    admin_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    worker = db.relationship("User", foreign_keys=[worker_id], lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "worker_id": self.worker_id,
            "worker_name": self.worker.name if self.worker else "Worker",
            "amount": round(self.amount or 0.0, 2),
            "reason": self.reason,
            "status": self.status,
            "admin_notes": self.admin_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Tip(db.Model):
    """Optional extra money the customer gives the worker after a job."""

    __tablename__ = "tips"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "worker_id": self.worker_id,
            "amount": round(self.amount or 0.0, 2),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Review(db.Model):
    """Two-sided star rating and detailed service feedback."""

    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    rating = db.Column(db.Integer, nullable=False)  # 1 to 5
    quality_score = db.Column(db.Integer, default=5)
    professionalism_score = db.Column(db.Integer, default=5)
    timeliness_score = db.Column(db.Integer, default=5)

    comment = db.Column(db.Text)
    review_type = db.Column(db.String(30), default="customer_to_worker")
    is_disputed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    customer = db.relationship("User", foreign_keys=[customer_id], lazy="joined")
    worker   = db.relationship("User", foreign_keys=[worker_id],   lazy="joined")
    booking  = db.relationship("Booking", foreign_keys=[booking_id], lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "customer_id": self.customer_id,
            "customer_name": self.customer.name if self.customer else "Customer",
            "worker_id": self.worker_id,
            "worker_name": self.worker.name if self.worker else "Worker",
            "rating": self.rating,
            "quality_score": self.quality_score,
            "professionalism_score": self.professionalism_score,
            "timeliness_score": self.timeliness_score,
            "comment": self.comment,
            "review_type": self.review_type,
            "is_disputed": self.is_disputed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Dispute(db.Model):
    """Structured dispute system for booking conflicts."""

    __tablename__ = "disputes"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False)
    raised_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    against_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    cooperative_id = db.Column(db.Integer, db.ForeignKey("cooperatives.id"))

    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    evidence_url = db.Column(db.String(255))

    status = db.Column(db.String(20), default="open")  # open / under_review / resolved / rejected
    resolution_notes = db.Column(db.Text)
    resolved_by_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    booking = db.relationship("Booking", foreign_keys=[booking_id], lazy="joined")
    raised_by = db.relationship("User", foreign_keys=[raised_by_id], lazy="joined")
    against = db.relationship("User", foreign_keys=[against_id], lazy="joined")
    cooperative = db.relationship("Cooperative", foreign_keys=[cooperative_id], lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "service_name": self.booking.service.name if (self.booking and self.booking.service) else None,
            "raised_by_id": self.raised_by_id,
            "raised_by_name": self.raised_by.name if self.raised_by else "User",
            "raised_by_role": self.raised_by.role if self.raised_by else "User",
            "against_id": self.against_id,
            "against_name": self.against.name if self.against else "N/A",
            "cooperative_id": self.cooperative_id,
            "cooperative_name": self.cooperative.name if self.cooperative else None,
            "category": self.category,
            "description": self.description,
            "evidence_url": self.evidence_url,
            "status": self.status,
            "resolution_notes": self.resolution_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SupportTicket(db.Model):
    """A help request raised from the Help Centre."""

    __tablename__ = "support_tickets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"))
    category = db.Column(db.String(40))
    subject = db.Column(db.String(140), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default="open")
    admin_response = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[user_id], lazy="joined")
    booking = db.relationship("Booking", foreign_keys=[booking_id], lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "user_role": self.user.role if self.user else None,
            "user_email": self.user.email if self.user else None,
            "booking_id": self.booking_id,
            "service_name": self.booking.service.name if (self.booking and self.booking.service) else None,
            "category": self.category,
            "subject": self.subject,
            "description": self.description,
            "status": self.status,
            "admin_response": self.admin_response,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
