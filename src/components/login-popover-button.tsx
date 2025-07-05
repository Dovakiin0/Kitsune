import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Button from "./common/custom-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import DiscordIcon from "@/icons/discord";
import { pb } from "@/lib/pocketbase";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";

type FormData = {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
};

function LoginPopoverButton() {
  const auth = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [tabValue, setTabValue] = useState<"login" | "signup">("login");

  const loginWithEmail = async () => {
    try {
      if (formData.username === "" || formData.password === "") {
        toast.error("Please fill in all fields", {
          style: { background: "red" },
        });
        return;
      }

      await pb
        .collection("users")
        .authWithPassword(formData.username, formData.password);

      if (pb.authStore.isValid && pb.authStore.record) {
        toast.success("Login successful", { style: { background: "green" } });
        clearForm();
        auth.setAuth({
          id: pb.authStore.record.id,
          email: pb.authStore.record.email,
          username: pb.authStore.record.username,
          avatar: pb.authStore.record.avatar,
          collectionId: pb.authStore.record.collectionId,
          collectionName: pb.authStore.record.collectionName,
          autoSkip: pb.authStore.record.autoSkip,
        });
      }
    } catch (e) {
      console.error("Login error:", e);
      toast.error("Invalid username or password", {
        style: { background: "red" },
      });
    }
  };

  const signupWithEmail = async () => {
    if (
      formData.username === "" ||
      formData.password === "" ||
      formData.email === "" ||
      formData.confirm_password === ""
    ) {
      toast.error("Please fill in all fields", {
        style: { background: "red" },
      });
      return;
    }

    try {
      const user = await pb.collection("users").create({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.confirm_password,
      });

      if (user) {
        toast.success("Account created successfully. Please login.", {
          style: { background: "green" },
        });
        clearForm();
        setTabValue("login");
      }
    } catch (e: any) {
      if (e.response?.data) {
        for (const key in e.response?.data) {
          toast.error(`${key}: ${e.response.data[key].message}`, {
            style: { background: "red" },
          });
        }
      } else {
        toast.error("Signup failed. Please try again.", {
          style: { background: "red" },
        });
      }
    }
  };

  const clearForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    });
  };

  const loginWithDiscord = async () => {
    const res = await pb.collection("users").authWithOAuth2({
      provider: "discord",
    });

    if (pb.authStore.isValid && pb.authStore.record) {
      await pb.collection("users").update(pb.authStore.record?.id!, {
        username: res.meta?.username,
      });

      toast.success("Login successful", { style: { background: "green" } });
      auth.setAuth({
        id: pb.authStore.record.id,
        email: pb.authStore.record.email,
        username: pb.authStore.record.username,
        avatar: pb.authStore.record.avatar,
        collectionId: pb.authStore.record.collectionId,
        collectionName: pb.authStore.record.collectionName,
        autoSkip: pb.authStore.record.autoSkip,
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-white text-md text-black hover:bg-gray-200 hover:text-black transition-all duration-300"
        >
          Login
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        className="bg-black bg-opacity-50 backdrop-blur-sm w-[300px] mt-4 mr-4 p-4"
      >
        <Tabs
          defaultValue={tabValue}
          value={tabValue}
          onValueChange={(value) => setTabValue(value as "login" | "signup")}
        >
          <TabsList>
            <TabsTrigger onClick={clearForm} value="login">
              Login
            </TabsTrigger>
            <TabsTrigger onClick={clearForm} value="signup">
              Signup
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="flex flex-col gap-2">
            <div className="mt-2">
              <p className="text-gray-300 text-xs">Email or Username:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                type="text"
                value={formData.username}
                placeholder="Enter your email/username"
              />
            </div>
            <div>
              <p className="text-gray-300 text-xs">Password:</p>
              <Input
                required
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter your password"
              />
            </div>
            <Button
              variant="default"
              className="w-full text-xs"
              size="sm"
              type="submit"
              onClick={loginWithEmail}
            >
              Login
            </Button>
            <hr className="text-white text-xs text-center" />
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-800 text-white w-full text-xs"
              size="sm"
              onClick={loginWithDiscord}
            >
              <DiscordIcon className="mr-2" />
              Login with Discord
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="flex flex-col gap-2">
            <div>
              <p className="text-gray-300 text-xs">Username:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                type="text"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <p className="text-gray-300 text-xs">Email:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                type="email"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <p className="text-gray-300 text-xs">Password:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                type="password"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <p className="text-gray-300 text-xs">Confirm Password:</p>
              <Input
                required
                onChange={(e) =>
                  setFormData({ ...formData, confirm_password: e.target.value })
                }
                type="password"
                placeholder="Enter your password again"
              />
            </div>
            <Button
              variant="default"
              className="w-full text-xs"
              size="sm"
              type="submit"
              onClick={signupWithEmail}
            >
              Signup
            </Button>
            <hr className="text-white text-xs text-center" />
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-800 text-white w-full text-xs"
              size="sm"
              onClick={loginWithDiscord}
            >
              <DiscordIcon className="mr-2" />
              Signup with Discord
            </Button>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export default LoginPopoverButton;
