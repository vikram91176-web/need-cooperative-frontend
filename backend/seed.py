"""
seed.py — fills the database with demo data for NEED.

WHAT: Creates services, admin, customers, workers, labour cooperatives, sample bookings, payments, and disputes.
WHY:  Provides realistic demonstration data for Cooperative & Platform Dashboards.
HOW:  Run once from backend folder:   python seed.py
"""

from datetime import datetime
from werkzeug.security import generate_password_hash

from app import app
from models import Booking, Cooperative, Dispute, Payment, Review, Service, SupportTicket, User, WelfareWallet, WorkerProfile, db
from routes import WALLET_INSURANCE_SHARE, WALLET_LIQUID_SHARE, WELFARE_RATE

DEMO_PASSWORD = "demo123"

SERVICES = [
    ("Electrician", "Home Services", "Wiring, switches, fans and light fittings", 299, "electrician"),
    ("Plumber", "Home Services", "Leaking taps, blocked drains and pipe fitting", 249, "plumber"),
    ("Carpenter", "Home Services", "Furniture repair, door and cupboard work", 349, "carpenter"),
    ("Painter", "Home Services", "Wall painting, putty work and touch-ups", 1499, "painter"),
    ("Cleaner", "Home Services", "Deep cleaning for kitchen, bathroom and floors", 499, "cleaner"),
    ("Gardener", "Home Services", "Lawn cutting, plant care and terrace gardens", 399, "gardener"),
    ("House Help", "Home Services", "Daily household help and kitchen assistance", 599, "house-help"),
    ("Caregiver", "Home Services", "Elderly care, patient care and child care", 899, "caregiver"),
    ("Driver", "Home Services", "Hourly or full-day driver on request", 699, "driver"),
    ("Technician", "Home Services", "General technical repairs around the house", 349, "technician"),

    ("AC Service", "Appliance Services", "AC servicing, gas refilling and installation", 599, "ac-service"),
    ("Refrigerator Service", "Appliance Services", "Cooling problems, gas charging and repair", 449, "refrigerator"),
    ("Washing Machine Service", "Appliance Services", "Drum, motor and drainage repairs", 399, "washing-machine"),
    ("TV Installation", "Appliance Services", "Wall mounting, setup and channel tuning", 499, "tv"),
    ("Appliance Repair", "Appliance Services", "Mixer, geyser, microwave and small appliances", 349, "appliance-repair"),

    ("Car Washing", "Other Services", "Doorstep car cleaning, inside and outside", 199, "car-washing"),
    ("Construction Labour", "Other Services", "Skilled and unskilled labour on daily wages", 799, "construction"),
    ("Pest Control", "Other Services", "Cockroach, termite and mosquito treatment", 1199, "pest-control"),
    ("Pet Grooming", "Other Services", "Bathing, trimming and nail care for pets", 699, "pet-grooming"),
    ("Barber", "Other Services", "Haircut and grooming at your doorstep", 149, "barber"),
]

COOPERATIVES_DATA = [
    {
        "name": "Noida Artisans & Electricians Cooperative Union",
        "registration_number": "COOP-UP-2022-1082",
        "city": "Noida",
        "address": "Block B, Sector 62, Noida, UP",
        "categories": "Home Services, Electrician, Carpenter",
        "desc": "Registered Labour Society representing 450+ certified electricians and carpentry artisans in Noida & Greater Noida.",
        "email": "admin@noida-electricians.coop",
        "phone": "9818001001",
        "rating": 4.9,
    },
    {
        "name": "NCR Certified Plumbers & Sanitary Federation",
        "registration_number": "COOP-DL-2023-4410",
        "city": "Ghaziabad & Noida",
        "address": "Commercial Hub, Indirapuram, Ghaziabad",
        "categories": "Plumbing, Sanitation, Home Maintenance",
        "desc": "Government-recognized plumbing and pipework cooperative providing 100% background-verified master plumbers.",
        "email": "admin@ncr-plumbers.coop",
        "phone": "9818001002",
        "rating": 4.8,
    },
    {
        "name": "Greater Noida Home Appliance & AC Technicians Society",
        "registration_number": "COOP-UP-2024-9921",
        "city": "Greater Noida",
        "address": "Knowledge Park II, Greater Noida, UP",
        "categories": "Appliance Services, AC Repair, Refrigerator",
        "desc": "Worker-owned HVAC and appliance repair cooperative committed to transparent pricing and fair wage sharing.",
        "email": "admin@gnoida-technicians.coop",
        "phone": "9818001003",
        "rating": 4.7,
    },
]

CUSTOMERS = [
    ("Ananya Mehta", "ananya@example.com", "9810000001", "B-42, Sector 62, Noida", "female", 28.6270, 77.3720),
    ("Rohit Malhotra", "rohit@example.com", "9810000002", "C-11, Sector 18, Noida", "male", 28.5700, 77.3210),
    ("Sneha Kapoor", "sneha@example.com", "9810000003", "Flat 304, Indirapuram, Ghaziabad", "female", 28.6420, 77.3720),
    ("Imran Qureshi", "imran@example.com", "9810000004", "A-9, Sector 50, Noida", "male", 28.5680, 77.3600),
    ("Divya Nair", "divya@example.com", "9810000005", "D-7, Sector 76, Noida", "female", 28.5700, 77.3900),
]

WORKERS = [
    ("Rahul Kumar", "rahul@example.com", "9820000001", "Electrician",
     "House wiring, Fan repair, MCB fitting", "ITI Electrician", 5, 4.8, 213,
     "verified", "Sector 62, Noida", 28.6280, 77.3649, 0),

    ("Amit Sharma", "amit@example.com", "9820000002", "Plumber",
     "Pipe fitting, Leak repair, Tank cleaning", "Plumbing Level 2", 7, 4.6, 341,
     "verified", "Sector 18, Noida", 28.5701, 77.3230, 1),

    ("Suresh Yadav", "suresh@example.com", "9820000003", "Carpenter",
     "Modular furniture, Door frames, Polishing", "Woodwork Craftsman", 10, 4.9, 402,
     "verified", "Indirapuram, Ghaziabad", 28.6430, 77.3710, 0),

    ("Neha Devi", "neha@example.com", "9820000004", "Cleaner",
     "Deep cleaning, Sofa shampoo, Bathroom care", "Housekeeping Certified", 3, 4.7, 156,
     "verified", "Sector 50, Noida", 28.5690, 77.3610, 0),

    ("Priya Singh", "priya@example.com", "9820000005", "Painter",
     "Emulsion, Putty work, Texture finish", "Painting Skill Cert.", 4, 4.5, 98,
     "verified", "Vaishali, Ghaziabad", 28.6500, 77.3390, 0),

    ("Ramesh Chandra", "ramesh@example.com", "9820000006", "AC Service",
     "Split AC service, Gas refill, Installation", "HVAC Technician", 8, 4.8, 287,
     "verified", "Sector 62, Noida", 28.6260, 77.3680, 2),

    ("Sunita Kumari", "sunita@example.com", "9820000007", "House Help",
     "Cooking, Utensils, Daily cleaning", "Home Care Basics", 6, 4.6, 512,
     "verified", "Sector 76, Noida", 28.5720, 77.3880, 0),

    ("Vikram Rathore", "vikram@example.com", "9820000008", "Driver",
     "City driving, Outstation, Manual and automatic", "Commercial Licence", 9, 4.4, 176,
     "verified", "Sector 15, Noida", 28.5830, 77.3110, 0),

    ("Manoj Gupta", "manoj@example.com", "9820000009", "Refrigerator Service",
     "Cooling repair, Compressor, Gas charging", "Refrigeration Cert.", 6, 4.5, 143,
     "verified", "Mayur Vihar, Delhi", 28.6090, 77.2950, 2),

    ("Kavita Sharma", "kavita@example.com", "9820000010", "Caregiver",
     "Elderly care, Post-surgery care, Child care", "Nursing Assistant", 5, 4.9, 121,
     "verified", "Sector 47, Noida", 28.5660, 77.3550, 0),

    ("Deepak Verma", "deepak@example.com", "9820000011", "Washing Machine Service",
     "Front load, Top load, Drainage repair", "Appliance Repair Cert.", 4, 4.3, 87,
     "verified", "Sector 63, Noida", 28.6270, 77.3810, 2),

    ("Anil Kumar", "anil@example.com", "9820000012", "Pest Control",
     "Termite, Cockroach, Mosquito treatment", "Pest Management Lic.", 5, 4.6, 164,
     "verified", "Sector 12, Noida", 28.5890, 77.3260, 1),

    ("Rajesh Nair", "rajesh@example.com", "9820000013", "Technician",
     "Geyser, Mixer, Microwave, Chimney", "Multi-skill Technician", 11, 4.8, 356,
     "verified", "Sector 61, Noida", 28.6200, 77.3620, 2),

    ("Irfan Khan", "irfan@example.com", "9820000017", "TV Installation",
     "Wall mounting, Set-top box, Channel tuning", "Electronics Install Cert.", 5, 4.6, 132,
     "verified", "Sector 27, Noida", 28.5820, 77.3230, 2),

    ("Pooja Bisht", "pooja@example.com", "9820000018", "Appliance Repair",
     "Mixer, Geyser, Microwave, Induction", "Small Appliance Repair", 4, 4.4, 96,
     "verified", "Sector 55, Noida", 28.5910, 77.3590, 2),

    ("Shyam Lal", "shyam@example.com", "9820000019", "Construction Labour",
     "Masonry, Plastering, Site helper", "Skilled Mason", 12, 4.5, 268,
     "verified", "Sector 71, Noida", 28.5960, 77.3800, 0),

    ("Ritu Chauhan", "ritu@example.com", "9820000020", "Pet Grooming",
     "Bathing, Trimming, Nail care, De-shedding", "Pet Care Basics", 3, 4.7, 74,
     "verified", "Sector 29, Noida", 28.5700, 77.3260, 0),

    ("Farhan Ali", "farhan@example.com", "9820000014", "Barber",
     "Haircut, Beard styling, Head massage", "Grooming Course", 6, 0.0, 0,
     "pending", "Sector 22, Noida", 28.5810, 77.3320, 0),

    ("Geeta Rani", "geeta@example.com", "9820000015", "Gardener",
     "Lawn care, Pruning, Terrace garden setup", "Horticulture Basics", 3, 0.0, 0,
     "pending", "Sector 44, Noida", 28.5620, 77.3480, 0),

    ("Mohit Saini", "mohit@example.com", "9820000016", "Car Washing",
     "Exterior wash, Interior vacuum", "", 1, 0.0, 0,
     "rejected", "Sector 37, Noida", 28.5580, 77.3300, 1),
]


def seed():
    """Wipe database and seed comprehensive demo data."""
    with app.app_context():
        print("Clearing database...")
        db.drop_all()
        db.create_all()

        # 1. Services
        for name, category, description, price, icon in SERVICES:
            db.session.add(Service(
                name=name, category=category, description=description, starting_price=price, icon=icon
            ))
        print(f"Added {len(SERVICES)} services")

        # 2. Platform Admin
        admin_user = User(
            name="NEED Admin",
            email="admin@need.in",
            phone="9800000000",
            password_hash=generate_password_hash("admin123"),
            role="admin",
            address="Cooperative Federation Head Office, Noida",
            gender="other",
            language="en",
            is_verified=True,
            trust_badge="Platform Administrator",
            accepted_terms=True,
        )
        db.session.add(admin_user)
        db.session.commit()

        # 3. Cooperatives & Cooperative Admins
        coop_objs = []
        for idx, cdata in enumerate(COOPERATIVES_DATA):
            ca_user = User(
                name=f"{cdata['name']} Administrator",
                email=cdata["email"],
                phone=cdata["phone"],
                password_hash=generate_password_hash(DEMO_PASSWORD),
                role="cooperative_admin",
                address=cdata["address"],
                language="en",
                is_verified=True,
                trust_badge="Cooperative Administrator",
                accepted_terms=True,
            )
            db.session.add(ca_user)
            db.session.flush()

            coop = Cooperative(
                name=cdata["name"],
                registration_number=cdata["registration_number"],
                verification_status="verified",
                city=cdata["city"],
                address=cdata["address"],
                service_categories=cdata["categories"],
                description=cdata["desc"],
                contact_email=cdata["email"],
                contact_phone=cdata["phone"],
                admin_user_id=ca_user.id,
                rating=cdata["rating"],
                platform_fee_percent=10.0,
                cooperative_fee_percent=5.0,
            )
            db.session.add(coop)
            db.session.flush()
            coop_objs.append(coop)

        db.session.commit()
        print(f"Added {len(coop_objs)} Labour Cooperatives & Cooperative Admins")

        # 4. Customers
        customer_users = []
        for name, email, phone, address, gender, lat, lng in CUSTOMERS:
            cuser = User(
                name=name,
                email=email,
                phone=phone,
                password_hash=generate_password_hash(DEMO_PASSWORD),
                role="customer",
                address=address,
                gender=gender,
                language="en",
                latitude=lat,
                longitude=lng,
                is_verified=True,
                trust_badge="Verified Customer",
                accepted_terms=True,
            )
            db.session.add(cuser)
            customer_users.append(cuser)
        db.session.commit()
        print(f"Added {len(CUSTOMERS)} customers")

        # 5. Workers
        worker_users = []
        for (
            name, email, phone, service, skills, certification, years,
            rating, jobs, status, city, lat, lng, coop_idx
        ) in WORKERS:
            wuser = User(
                name=name,
                email=email,
                phone=phone,
                password_hash=generate_password_hash(DEMO_PASSWORD),
                role="worker",
                address=city,
                gender="female" if name.split()[0] in ("Neha", "Priya", "Sunita", "Kavita", "Geeta") else "male",
                language="hi",
                latitude=lat,
                longitude=lng,
                is_verified=status == "verified",
                trust_badge="Cooperative Member" if status == "verified" else "Pending Verification",
                accepted_terms=True,
            )
            db.session.add(wuser)
            db.session.flush()
            worker_users.append(wuser)

            coop_id = coop_objs[coop_idx].id if (coop_idx < len(coop_objs)) else None

            db.session.add(WorkerProfile(
                user_id=wuser.id,
                cooperative_id=coop_id,
                skills=skills,
                certifications=certification,
                experience_years=years,
                verification_status=status,
                identity_verified=status == "verified",
                skill_verified=status == "verified",
                identity_proof="aadhaar_demo.jpg",
                rating=rating,
                total_jobs=jobs,
                earnings=round(jobs * 380.0, 2),
                service_radius_km=10,
                is_available=status == "verified",
                primary_service=service,
                city=city,
            ))

            contribution = round(jobs * 380.0 * WELFARE_RATE, 2)
            db.session.add(WelfareWallet(
                worker_id=wuser.id,
                balance=round(contribution * WALLET_LIQUID_SHARE, 2),
                total_contribution=contribution,
                insurance_contribution=round(contribution * WALLET_INSURANCE_SHARE, 2),
            ))

        db.session.commit()
        print(f"Added {len(WORKERS)} workers affiliated with cooperatives")

        # 6. Sample Bookings, Payments, Reviews & Disputes
        customer1 = customer_users[0]  # Ananya
        worker1 = worker_users[0]      # Rahul Kumar (Electrician)
        service1 = Service.query.filter_by(name="Electrician").first()

        b1 = Booking(
            customer_id=customer1.id,
            worker_id=worker1.id,
            cooperative_id=coop_objs[0].id,
            service_id=service1.id,
            scheduled_date="2026-09-05",
            scheduled_time="11:00",
            address=customer1.address,
            description="Short circuit in main switchboard and living room fan noise.",
            is_emergency=False,
            amount=299.0,
            status="completed",
            accepted_at=datetime.utcnow(),
            assigned_at=datetime.utcnow(),
            on_the_way_at=datetime.utcnow(),
            arrived_at=datetime.utcnow(),
            in_progress_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            confirmed_at=datetime.utcnow(),
            completion_note="Replaced 16A MCB switch and lubricated ceiling fan bearing.",
        )
        db.session.add(b1)
        db.session.flush()

        p1 = Payment(
            booking_id=b1.id,
            amount=299.0,
            method="upi",
            status="successful",
            invoice_id="SHR-INV-2026-NEED01",
            platform_fee=29.9,
            cooperative_share=14.95,
            worker_earnings=254.15,
            welfare_contribution=29.9,
        )
        db.session.add(p1)

        r1 = Review(
            booking_id=b1.id,
            customer_id=customer1.id,
            worker_id=worker1.id,
            rating=5,
            quality_score=5,
            professionalism_score=5,
            timeliness_score=5,
            comment="Punctual, cooperative member who explained the issue clearly. Highly recommended!",
            review_type="customer_to_worker",
        )
        db.session.add(r1)

        # Sample dispute
        d1 = Dispute(
            booking_id=b1.id,
            raised_by_id=customer1.id,
            against_id=worker1.id,
            cooperative_id=coop_objs[0].id,
            category="Quality Dispute",
            description="Switchboard light flickered slightly after repair, requested cooperative follow-up check.",
            status="resolved",
            resolution_notes="Cooperative dispatched senior supervisor to inspect; connection re-tightened free of charge.",
            resolved_by_id=coop_objs[0].admin_user_id,
        )
        db.session.add(d1)

        db.session.commit()
        print("Seeded sample completed booking, payment breakdown, review and dispute.")

        print("\n========================================================")
        print("  NEED PLATFORM DEMO LOGINS READY:")
        print("========================================================")
        print("  Platform Admin    : admin@need.in / admin123")
        print(f"  Cooperative Admin : admin@noida-electricians.coop / {DEMO_PASSWORD}")
        print(f"  Customer          : ananya@example.com / {DEMO_PASSWORD}")
        print(f"  Worker            : rahul@example.com / {DEMO_PASSWORD}")
        print("========================================================")


if __name__ == "__main__":
    seed()
