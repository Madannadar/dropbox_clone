import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, isNull } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// imagekit credentials
const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function POST(request: NextResponse) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) // this will catch unauth even if they bypass the middleware

        // parse the form data
        const formData = await request.formData()
        const file = formData.get("file") as File // this is the file that is being uploaded
        const formUserId = formData.get("userId") as string // this is the userId that is being uploaded
        const parentId = formData.get("parentId") as string || null // this is the parentId that is being uploaded

        if (!formUserId || formUserId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 400 })
        }

        if (parentId) {
            // check if the parentId is valid
            const [parentFolder] = await db
                .select()
                .from(files)
                .where(
                    and(
                        eq(files.id, parentId),
                        eq(files.userId, userId),
                        eq(files.isFolder, true),
                    )
                )
        } else {
            return NextResponse.json({ error: "Parent folder not found" }, { status: 400 })
        }

        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
            return NextResponse.json({ error: "File type not supported only images and pdf are supported" }, { status: 400 })
        }
// convert file to buffer
        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer); // convert the file to buffer

        const folderpath = parentId ? `/droply/${userId}/folder/${parentId}`: `/droply/${userId}` // this is the folder path that is being uploaded to
        const originalFileName = file.name // this is the original file name that is being uploaded 
        const fileExtention = originalFileName.split(".").pop() || ""// this is the file extention that is being uploaded
        // check for empty file extension
        if (!fileExtention) {
            return NextResponse.json({ error: "File extension not found" }, { status: 400 })
        }
        const uniqueFilename = `${uuidv4()}.${fileExtention}` // this is the unique filename that is being uploaded

        const uploadResponse = await imagekit.upload({
            file: fileBuffer,
            fileName: uniqueFilename,
            folder: folderpath,
            useUniqueFileName: false, // this is a replacement for the unique filename above
        })

        const fileData = {
            name: originalFileName || "Untitled",
            path: uploadResponse.filePath,
            size: file.size,
            type: file.type,
            fileUrl: uploadResponse.url,
            thumbnailUrl: uploadResponse.thumbnailUrl || null,
            userId: userId,
            parentId: parentId, 
            isFolder: false,
            isStarred: false,
            isTrash: false,
        }

        const [newFile] = await db.insert(files).values(fileData).returning()
        return NextResponse.json(newFile, { status: 201 })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }
}