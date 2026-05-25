from sqlalchemy.orm import Session

from app.modules.contacts.schemas import ContactRequest as ContactRequestSchema, ContactResponse
from app.modules.contacts.models import ContactRequest as ContactRequestModel
from app.modules.contacts import repository

def submit_contact(db: Session, contact: ContactRequestSchema) -> ContactResponse:
    # Có thể map schema sang model ở đây trước khi lưu
    db_contact = ContactRequestModel(**contact.model_dump())
    return repository.save_contact_request(db, db_contact)

def get_contact_requests(db: Session) -> list[ContactRequestModel]:
    return repository.list_contact_requests(db)

def get_contact_request_by_id(db: Session, id: str):
    return repository.get_contact_request_by_id(db, id)

def delete_contact_request(db: Session, id: str):
    return repository.delete_contact_request(db, id)

def update_contact_request(db: Session, id: str, contact_request: ContactRequestModel):
    return repository.update_contact_request(db, id, contact_request)
