import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import config from "@/config";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { CreditCard, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function UserProfile() {
  const router = useRouter();

  if (!config?.auth?.enabled) {
    router.back();
  }

  const { user } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className="w-[2.25rem] h-[2.25rem] cursor-pointer"
      >
        <Avatar>
          <AvatarImage
            src="https://cdn-icons-png.flaticon.com/512/6596/6596121.png"
            alt="User Profile"
          />
          <AvatarFallback></AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/user-profile" className="cursor-pointer">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/settings" className="cursor-pointer">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <SignOutButton>
          <DropdownMenuItem
            onClick={() => {
              document.cookie = "pk=false";
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
