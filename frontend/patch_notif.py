with open("src/shared/components/NotificationBell.tsx", "r") as f:
    content = f.read()

import_statement = "import { playNotificationSound } from '../utils/sound';\n"
if "import { playNotificationSound }" not in content:
    content = content.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\n" + import_statement)

# Now add playNotificationSound() before toast.info
sound_call = "playNotificationSound();\n                    toast.info(newNotif.title,"
content = content.replace("toast.info(newNotif.title,", sound_call)

with open("src/shared/components/NotificationBell.tsx", "w") as f:
    f.write(content)
