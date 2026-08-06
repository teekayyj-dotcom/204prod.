with open("src/modules/messaging/store/ChatContext.tsx", "r") as f:
    content = f.read()

import_statement = 'import { playNotificationSound } from "../../../shared/utils/sound";\n'
if "import { playNotificationSound }" not in content:
    content = content.replace('import { toast } from "sonner";', 'import { toast } from "sonner";\n' + import_statement)

# Now add playNotificationSound() before toast.custom
sound_call = "playNotificationSound();\n            toast.custom((t) => ("
content = content.replace("toast.custom((t) => (", sound_call)

with open("src/modules/messaging/store/ChatContext.tsx", "w") as f:
    f.write(content)
