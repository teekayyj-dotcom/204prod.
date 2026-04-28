from fastapi import APIRouter

from app.modules.contacts.schemas import ContactRequest
from app.modules.contacts.service import submit_contact

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("")
def submit_contact_route(payload: ContactRequest):
    return submit_contact(payload)
