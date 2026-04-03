"use server";

import { redirect } from "next/navigation";

import { destroySession } from "@/lib/auth";
import { withAppBasePath } from "@/lib/app-paths";

export async function logoutAction() {
  await destroySession();
  redirect(withAppBasePath("/login"));
}
