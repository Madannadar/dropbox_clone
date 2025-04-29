import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ fileId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { fileId } = await props.params

        if (!fileId) {
            return NextResponse.json({ error: "File id not found" }, { status: 400 })
        }

        const [file] = await db
            .select()
            .from(files)
            .where(
                and(
                    eq(files.id, fileId),
                    eq(files.userId, userId),
                    // eq(files.isStarred, false)
                )
            )

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 })
        }

        // toggle the isStarred valued
        const updatedFiles = await db.update(files)
            .set({isStarred: !file.isStarred})
            .where( and (
                eq(files.id, fileId),
                eq(files.userId, userId),
            ))
            .returning()

            console.log(updatedFiles)

            const updatedFile = updatedFiles[0]

            return NextResponse.json(updatedFile, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
    }
}
