from sqlalchemy.orm import Session

from app.modules.contacts.models import ContactRequest

def list_contact_requests(db: Session):
    return db.query(ContactRequest).all()

def get_contact_request_by_id(db: Session, id: str):
    return db.query(ContactRequest).filter(ContactRequest.id == id).first()

def save_contact_request(db: Session, contact: ContactRequest) -> ContactRequest:
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

def delete_contact_request(db: Session, id: str):
    contact_request = db.query(ContactRequest).filter(ContactRequest.id == id).first()
    if not contact_request:
        return None
    db.delete(contact_request)
    db.commit()
    return True

def update_contact_request(db: Session, id: str, contact_request: ContactRequest):
    existing_contact_request = db.query(ContactRequest).filter(ContactRequest.id == id).first()
    if not existing_contact_request:
        return None
    existing_contact_request.name = contact_request.name
    existing_contact_request.email = contact_request.email
    existing_contact_request.phone = contact_request.phone
    existing_contact_request.message = contact_request.message
    db.commit()
    db.refresh(existing_contact_request)
    return existing_contact_request
