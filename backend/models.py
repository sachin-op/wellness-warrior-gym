from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# ─────────────────────────────────────────────────────────────────────
# USER
# ─────────────────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "user"

    id               = db.Column(db.Integer,   primary_key=True)
    username         = db.Column(db.String(80),  unique=True, nullable=False)
    email            = db.Column(db.String(120), unique=True, nullable=False)
    password         = db.Column(db.String(256), nullable=False)
    role             = db.Column(db.String(20),  nullable=False, default="member")
    phone            = db.Column(db.String(15),  nullable=True)
    created_at       = db.Column(db.DateTime,    default=datetime.utcnow)

    # approval system
    status           = db.Column(db.String(20),  nullable=False, default="pending")
    reg_number       = db.Column(db.String(20),  nullable=True, unique=True)
    agreed_to_rules  = db.Column(db.Boolean,     default=False)
    approved_at      = db.Column(db.DateTime,    nullable=True)
    terminated_at    = db.Column(db.DateTime,    nullable=True)
    terminate_reason = db.Column(db.String(256), nullable=True)

    # health profile
    height_cm        = db.Column(db.Float,       nullable=True)
    goal_weight_kg   = db.Column(db.Float,       nullable=True)

    # relationships
    admission        = db.relationship("Admission",  backref="member", uselist=False)
    attendances      = db.relationship("Attendance", backref="member", lazy=True)
    weight_logs      = db.relationship("WeightLog",  backref="member", lazy=True)
    water_logs       = db.relationship("WaterLog",   backref="water_member", lazy=True)


    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            "id":               self.id,
            "username":         self.username,
            "email":            self.email,
            "role":             self.role,
            "phone":            self.phone,
            "created_at":       self.created_at.isoformat(),
            "status":           self.status,
            "reg_number":       self.reg_number,
            "agreed_to_rules":  self.agreed_to_rules,
            "approved_at":      self.approved_at.isoformat() if self.approved_at else None,
            "terminated_at":    self.terminated_at.isoformat() if self.terminated_at else None,
            "terminate_reason": self.terminate_reason,
            "height_cm":        self.height_cm,
            "goal_weight_kg":   self.goal_weight_kg,
        }


# ─────────────────────────────────────────────────────────────────────
# MEMBERSHIP PLAN
# ─────────────────────────────────────────────────────────────────────
class MembershipPlan(db.Model):
    __tablename__ = "membership_plan"

    id             = db.Column(db.Integer,     primary_key=True)
    name           = db.Column(db.String(80),  nullable=False)
    plan_type      = db.Column(db.String(20),  nullable=False, default="Starter")  # Starter/Pro/Elite
    duration_days  = db.Column(db.Integer,     nullable=False)
    duration_label = db.Column(db.String(20),  nullable=False, default="1 Month")  # 1 Month/3 Months etc
    price          = db.Column(db.Integer,     nullable=False)
    original_price = db.Column(db.Integer,     nullable=True)   # for strikethrough
    features       = db.Column(db.Text,        nullable=True)   # JSON string
    is_active      = db.Column(db.Boolean,     default=True)
    is_offer       = db.Column(db.Boolean,     default=False)
    offer_label    = db.Column(db.String(50),  nullable=True)   # "Diwali Deal 🪔"
    created_at     = db.Column(db.DateTime,    default=datetime.utcnow)

    admissions = db.relationship("Admission", backref="plan", lazy=True)

    def to_dict(self):
        import json
        savings = None
        if self.original_price and self.original_price > self.price:
            savings = self.original_price - self.price
        return {
            "id":             self.id,
            "name":           self.name,
            "plan_type":      self.plan_type,
            "duration_days":  self.duration_days,
            "duration_label": self.duration_label,
            "price":          self.price,
            "original_price": self.original_price,
            "savings":        savings,
            "features":       json.loads(self.features) if self.features else [],
            "is_active":      self.is_active,
            "is_offer":       self.is_offer,
            "offer_label":    self.offer_label,
        }


# ─────────────────────────────────────────────────────────────────────
# TRAINER
# ─────────────────────────────────────────────────────────────────────
class Trainer(db.Model):
    __tablename__ = "trainer"

    id              = db.Column(db.Integer,     primary_key=True)
    name            = db.Column(db.String(80),  nullable=False)
    role            = db.Column(db.String(80),  nullable=False)
    bio             = db.Column(db.Text,        nullable=True)
    specializations = db.Column(db.Text,        nullable=True)
    image_url       = db.Column(db.String(256), nullable=True)

    def to_dict(self):
        import json
        return {
            "id":              self.id,
            "name":            self.name,
            "role":            self.role,
            "bio":             self.bio,
            "specializations": json.loads(self.specializations) if self.specializations else [],
            "image_url":       self.image_url,
        }


# ─────────────────────────────────────────────────────────────────────
# ADMISSION
# ─────────────────────────────────────────────────────────────────────
class Admission(db.Model):
    __tablename__ = "admission"

    id             = db.Column(db.Integer,    primary_key=True)
    member_id      = db.Column(db.Integer,    db.ForeignKey("user.id"),            nullable=False)
    plan_id        = db.Column(db.Integer,    db.ForeignKey("membership_plan.id"), nullable=False)
    admission_date = db.Column(db.DateTime,   default=datetime.utcnow)
    expiry_date    = db.Column(db.DateTime,   nullable=False)
    fee_status     = db.Column(db.String(20), nullable=False, default="Paid")
    amount_paid    = db.Column(db.Integer, nullable=False, default=0)
    is_active      = db.Column(db.Boolean,    default=True)

    payments    = db.relationship("Payment",    backref="admission", lazy=True)
    attendances = db.relationship("Attendance", backref="admission", lazy=True)

    def to_dict(self):
        plan_price  = self.plan.price if self.plan else 0
        remaining   = max(0, plan_price - self.amount_paid)
        return {
            "id":             self.id,
            "member_id":      self.member_id,
            "plan_id":        self.plan_id,
            "plan_name":      self.plan.name           if self.plan else None,
            "plan_type":      self.plan.plan_type       if self.plan else None,
            "duration_label": self.plan.duration_label  if self.plan else None,
            "plan_price":     plan_price,
            "amount_paid":    self.amount_paid,
            "remaining":      remaining,
            "is_offer":       self.plan.is_offer        if self.plan else False,
            "offer_label":    self.plan.offer_label     if self.plan else None,
            "admission_date": self.admission_date.isoformat(),
            "expiry_date":    self.expiry_date.isoformat(),
            "fee_status":     self.fee_status,
            "is_active":      self.is_active,
        }


# ─────────────────────────────────────────────────────────────────────
# ATTENDANCE
# ─────────────────────────────────────────────────────────────────────
class Attendance(db.Model):
    __tablename__ = "attendance"

    id             = db.Column(db.Integer,    primary_key=True)
    member_id      = db.Column(db.Integer,    db.ForeignKey("user.id"),      nullable=False)
    admission_id   = db.Column(db.Integer,    db.ForeignKey("admission.id"), nullable=False)
    shift          = db.Column(db.String(20), nullable=False)
    check_in_time  = db.Column(db.DateTime,   nullable=False, default=datetime.utcnow)
    check_out_time = db.Column(db.DateTime,   nullable=True)
    duration_mins  = db.Column(db.Integer,    nullable=True)
    date           = db.Column(db.Date,       nullable=False, default=date.today)
    status         = db.Column(db.String(20), nullable=False, default="Present")

    def to_dict(self):
        return {
            "id":             self.id,
            "member_id":      self.member_id,
            "member_name":    self.member.username if self.member else None,
            "shift":          self.shift,
            "check_in_time":  self.check_in_time.isoformat(),
            "check_out_time": self.check_out_time.isoformat() if self.check_out_time else None,
            "duration_mins":  self.duration_mins,
            "date":           self.date.isoformat(),
            "status":         self.status,
        }


# ─────────────────────────────────────────────────────────────────────
# PAYMENT
# ─────────────────────────────────────────────────────────────────────
class Payment(db.Model):
    __tablename__ = "payment"

    id             = db.Column(db.Integer,     primary_key=True)
    admission_id   = db.Column(db.Integer,     db.ForeignKey("admission.id"), nullable=False)
    amount         = db.Column(db.Integer,     nullable=False)
    payment_date   = db.Column(db.DateTime,    default=datetime.utcnow)
    payment_method = db.Column(db.String(30),  nullable=False, default="Cash")  # Cash/PhonePe/GPay/Bank
    recorded_by    = db.Column(db.Integer,     db.ForeignKey("user.id"), nullable=True)
    notes          = db.Column(db.String(256), nullable=True)
    status         = db.Column(db.String(20),  nullable=False, default="Success")

    def to_dict(self):
        return {
            "id":             self.id,
            "admission_id":   self.admission_id,
            "amount":         self.amount,
            "payment_date":   self.payment_date.isoformat(),
            "payment_method": self.payment_method,
            "notes":          self.notes,
            "status":         self.status,
        }


# ─────────────────────────────────────────────────────────────────────
# WEIGHT LOG
# ─────────────────────────────────────────────────────────────────────
class WeightLog(db.Model):
    __tablename__ = "weight_log"

    id         = db.Column(db.Integer,   primary_key=True)
    member_id  = db.Column(db.Integer,   db.ForeignKey("user.id"), nullable=False)
    weight_kg  = db.Column(db.Float,     nullable=False)
    date       = db.Column(db.Date,      nullable=False, default=date.today)
    note       = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime,  default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":        self.id,
            "member_id": self.member_id,
            "weight_kg": self.weight_kg,
            "date":      self.date.isoformat(),
            "note":      self.note,
        }

# ─────────────────────────────────────────────────────────────────────
# WATER LOG
# ─────────────────────────────────────────────────────────────────────
class WaterLog(db.Model):
    __tablename__ = "water_log"

    id            = db.Column(db.Integer,  primary_key=True)
    member_id     = db.Column(db.Integer,  db.ForeignKey("user.id"), nullable=False)
    glasses_count = db.Column(db.Integer,  nullable=False, default=0)
    goal_glasses  = db.Column(db.Integer,  nullable=False, default=8)
    date          = db.Column(db.Date,     nullable=False, default=date.today)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        ml_consumed = self.glasses_count * 250
        ml_goal     = self.goal_glasses  * 250
        return {
            "id":            self.id,
            "member_id":     self.member_id,
            "glasses_count": self.glasses_count,
            "goal_glasses":  self.goal_glasses,
            "ml_consumed":   ml_consumed,
            "ml_goal":       ml_goal,
            "percentage":    round((self.glasses_count / self.goal_glasses) * 100) if self.goal_glasses else 0,
            "goal_achieved": self.glasses_count >= self.goal_glasses,
            "date":          self.date.isoformat(),
        }



# ─────────────────────────────────────────────────────────────────────
# ENQUIRY
# ─────────────────────────────────────────────────────────────────────
class Enquiry(db.Model):
    __tablename__ = "enquiry"

    id          = db.Column(db.Integer,     primary_key=True)
    name        = db.Column(db.String(80),  nullable=False)
    email       = db.Column(db.String(120), nullable=False)
    phone       = db.Column(db.String(15),  nullable=True)
    subject     = db.Column(db.String(120), nullable=True)
    message     = db.Column(db.Text,        nullable=False)
    created_at  = db.Column(db.DateTime,    default=datetime.utcnow)
    is_resolved = db.Column(db.Boolean,     default=False)

    def to_dict(self):
        return {
            "id":          self.id,
            "name":        self.name,
            "email":       self.email,
            "phone":       self.phone,
            "subject":     self.subject,
            "message":     self.message,
            "created_at":  self.created_at.isoformat(),
            "is_resolved": self.is_resolved,
        }