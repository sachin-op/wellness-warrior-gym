from flask import Blueprint, request, jsonify
from models import db, MembershipPlan, Trainer, Enquiry

public_bp = Blueprint("public", __name__, url_prefix="/api/public")

# ── GET /api/public/plans ─────────────────────────────────────────────
@public_bp.route("/plans", methods=["GET"])
def get_plans():
    plans = MembershipPlan.query.filter_by(is_active=True).all()
    return jsonify([p.to_dict() for p in plans]), 200

# ── GET /api/public/trainers ──────────────────────────────────────────
@public_bp.route("/trainers", methods=["GET"])
def get_trainers():
    trainers = Trainer.query.all()
    return jsonify([t.to_dict() for t in trainers]), 200

# ── POST /api/public/enquiry ──────────────────────────────────────────
@public_bp.route("/enquiry", methods=["POST"])
def submit_enquiry():
    data = request.get_json()
    if not data.get("name") or not data.get("email") or not data.get("message"):
        return jsonify({"error": "name, email, and message are required"}), 400

    enquiry = Enquiry(
        name    = data["name"],
        email   = data["email"],
        phone   = data.get("phone"),
        subject = data.get("subject"),
        message = data["message"],
    )
    db.session.add(enquiry)
    db.session.commit()

    return jsonify({"message": "Enquiry submitted successfully"}), 201