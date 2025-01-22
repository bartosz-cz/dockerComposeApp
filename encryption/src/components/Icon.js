import { ReactComponent as Account } from "../icons/Account.svg";
import { ReactComponent as Encrypted } from "../icons/Encrypted.svg";
import { ReactComponent as EncryptedAdd } from "../icons/EncryptedAdd.svg";
import { ReactComponent as EncryptedOff } from "../icons/EncryptedOff.svg";
import { ReactComponent as Key } from "../icons/Key.svg";
import { ReactComponent as Lock } from "../icons/Lock.svg";
import { ReactComponent as LockOpen } from "../icons/LockOpen.svg";
import { ReactComponent as Login } from "../icons/Login.svg";
import { ReactComponent as Copy } from "../icons/Copy.svg";
import { ReactComponent as Paste } from "../icons/Paste.svg";
import { ReactComponent as KeyOff } from "../icons/KeyOff.svg";
import { ReactComponent as Check } from "../icons/Check.svg";
import { ReactComponent as Register } from "../icons/Register.svg";
import { ReactComponent as Password } from "../icons/Password.svg";
import { ReactComponent as Username } from "../icons/Username.svg";
import { ReactComponent as Logout } from "../icons/Logout.svg";
import { ReactComponent as Admin } from "../icons/Admin.svg";
import { ReactComponent as Manage } from "../icons/Manage.svg";
import { ReactComponent as ArrowBack } from "../icons/ArrowBack.svg";
import { ReactComponent as RemoveUser } from "../icons/RemoveUser.svg";
import { ReactComponent as Share } from "../icons/Share.svg";
import { ReactComponent as Unshare } from "../icons/Unshare.svg";
import { ReactComponent as Info } from "../icons/Info.svg";
const Icon = ({ name, size = 48 }) => {
  const IconComponent = {
    Account: Account,
    Encrypted: Encrypted,
    EncryptedAdd: EncryptedAdd,
    EncryptedOff: EncryptedOff,
    Key: Key,
    Lock: Lock,
    LockOpen: LockOpen,
    Login: Login,
    Copy: Copy,
    Paste: Paste,
    KeyOff: KeyOff,
    Check: Check,
    Register: Register,
    Username: Username,
    Password: Password,
    Logout: Logout,
    Admin: Admin,
    Manage: Manage,
    ArrowBack: ArrowBack,
    RemoveUser: RemoveUser,
    Share: Share,
    Unshare: Unshare,
    Info: Info,
  }[name];

  if (!IconComponent) return null;

  return (
    <IconComponent
      width={size}
      height={size}
      aria-labelledby={name}
      role="img"
    />
  );
};

export default Icon;
