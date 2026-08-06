import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.modules.users.models import User
from app.modules.messaging.models import ConversationParticipant, Message

def main():
    db = SessionLocal()
    
    print("Đang tìm kiếm các user rác (display_name là 'Crew')...")
    junk_users = db.query(User).filter(User.display_name == 'Crew').all()
    
    if not junk_users:
        print("Không tìm thấy user rác nào có tên 'Crew'!")
        return

    print(f"\nĐã tìm thấy {len(junk_users)} user rác:")
    for u in junk_users:
        print(f" - ID: {u.id}, Email: {u.email}, Tên hiển thị: {u.display_name}")

    confirm = input(f"\nBạn có chắc chắn muốn xoá {len(junk_users)} user này và các dữ liệu liên quan không? (y/N): ")
    if confirm.lower() != 'y':
        print("Đã huỷ thao tác xoá.")
        return

    try:
        for u in junk_users:
            print(f"Đang xoá user {u.id}...")
            # Xoá các participant liên quan
            db.query(ConversationParticipant).filter(ConversationParticipant.user_id == u.id).delete()
            # Xoá các message do user này gửi
            db.query(Message).filter(Message.sender_id == u.id).delete()
            
            # Cuối cùng xoá user
            db.delete(u)
            
        db.commit()
        print("\n✅ Xoá thành công tất cả user rác và dữ liệu liên quan!")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Đã xảy ra lỗi khi xoá: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
