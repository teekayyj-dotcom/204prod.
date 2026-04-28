from app.modules.contacts.repository import save_contact_request
from app.modules.contacts.schemas import ContactRequest, ContactResponse


def submit_contact(contact: ContactRequest) -> ContactResponse:
    save_contact_request(contact)
    return ContactResponse(accepted=True)
