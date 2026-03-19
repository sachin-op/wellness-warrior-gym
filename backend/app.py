import os
import json
from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail

from config import Config
from models import db

migrate = Migrate()
jwt     = JWTManager()
mail    = Mail()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── Extensions ────────────────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": [
        "http://localhost:5173",
        "http://localhost:3000",
        os.environ.get("FRONTEND_URL", "*")
    ]}})

    # ── Register blueprints ───────────────────────────────────────────
    from auth.routes       import auth_bp
    from admin.routes      import admin_bp
    from member.routes     import member_bp
    from attendance.routes import attendance_bp
    from public.routes     import public_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(member_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(public_bp)

    # ── Seed default admin + sample data on first run ─────────────────
    with app.app_context():
        db.create_all()
        _seed_data()
    return app


def _seed_data():
    from models import User, MembershipPlan, Trainer
    from werkzeug.security import generate_password_hash
    import json

    # Admin
    if not User.query.filter_by(role="admin").first():
        admin = User(
            username  = "admin",
            email     = "admin@wellnesswarrior.com",
            password  = generate_password_hash("Admin@123"),
            role      = "admin",
            phone     = "9000000000",
            status    = "active",
        )
        db.session.add(admin)
        print("[Seed] Admin → email: admin@wellnesswarrior.com  password: Admin@123")

    # Trainers
    if not Trainer.query.first():
        trainers = [
            Trainer(name="Arjun Mehta",  role="Head Coach",
                bio="10+ years in competitive bodybuilding.",
                specializations=json.dumps(["Bodybuilding","Powerlifting"])),
            Trainer(name="Priya Sharma", role="Cardio Specialist",
                bio="NASM certified metabolic conditioning expert.",
                specializations=json.dumps(["HIIT","Fat Loss"])),
            Trainer(name="Rohit Verma",  role="Nutrition Coach",
                bio="Sports dietitian with 7 years experience.",
                specializations=json.dumps(["Nutrition","Bulking"])),
            Trainer(name="Sneha Gupta",  role="Mobility & Recovery",
                bio="Injury prevention and flexibility specialist.",
                specializations=json.dumps(["Mobility","Recovery"])),
        ]
        db.session.add_all(trainers)
        print("[Seed] 4 trainers created")

    # NOTE: No plans seeded — admin creates all plans from dashboard
    db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)