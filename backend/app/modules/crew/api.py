from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.modules.crew.service import (
    get_crew_members,
    get_crew_member_by_id,
    create_crew_member,
    update_crew_member,
    delete_crew_member,
)
from app.modules.crew.schemas import CrewMember as CrewMemberSchema, CrewMemberInput
from app.modules.crew.models import CrewMember

router = APIRouter(prefix="/crew", tags=["crew"])


@router.get("", response_model=list[CrewMemberSchema])
def list_crew_route(db: Session = Depends(get_db_session)):
    return get_crew_members(db)


@router.get("/{id}", response_model=CrewMemberSchema)
def get_crew_member_route(id: int, db: Session = Depends(get_db_session)):
    member = get_crew_member_by_id(db, id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew member not found"
        )
    return member


@router.post("", response_model=CrewMemberSchema, status_code=status.HTTP_201_CREATED)
def create_crew_member_route(req: CrewMemberInput, db: Session = Depends(get_db_session)):
    db_member = CrewMember(
        name=req.name,
        email=req.email,
        phone=req.phone,
        role=req.role,
        avatar=req.avatar,
        bio=req.bio,
        skills_expertise=req.skills_expertise,
        assigned_projects=req.assigned_projects,
        status=req.status
    )
    if req.created_at:
        db_member.created_at = req.created_at
    return create_crew_member(db, db_member)


@router.put("/{id}", response_model=CrewMemberSchema)
def update_crew_member_route(id: int, req: CrewMemberInput, db: Session = Depends(get_db_session)):
    db_member = CrewMember(
        name=req.name,
        email=req.email,
        phone=req.phone,
        role=req.role,
        avatar=req.avatar,
        bio=req.bio,
        skills_expertise=req.skills_expertise,
        assigned_projects=req.assigned_projects,
        status=req.status
    )
    if req.created_at:
        db_member.created_at = req.created_at
    updated = update_crew_member(db, id, db_member)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew member not found"
        )
    return updated


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crew_member_route(id: int, db: Session = Depends(get_db_session)):
    success = delete_crew_member(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crew member not found"
        )
    return None
