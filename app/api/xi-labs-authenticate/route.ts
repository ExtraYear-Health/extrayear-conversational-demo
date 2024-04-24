import { NextResponse } from "next/server";

export async function GET(request: Request) {
  //exit early so we don't request 70000000 keys while in devmode
  if (process.env.ELEVENLABS_API_KEY === "development") {
    return NextResponse.json({
      key: process.env.ELEVENLABS_API_KEY ?? "",
    });
  }