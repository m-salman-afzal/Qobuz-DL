import { NextResponse } from "next/server";
import { MusicUrlService } from "@/be/services/musicUrl.service";

export async function POST() {
    try {
         await MusicUrlService.findByDownloadStatusAndDownloadUrl()
            return new NextResponse(JSON.stringify({ success: true, data:"success" }), { status: 200 });
    } catch (error: any) {
        return new NextResponse(JSON.stringify({ success: false, error: error?.errors || error.message || "An error occurred parsing the request." }), { status: 400 });
    }
}