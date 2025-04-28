import {pgTable, text, uuid, integer, boolean, timestamp} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const files = pgTable('files', {
    id: uuid('id').defaultRandom().primaryKey(), // defaultrandomed generates a random UUID
    name: text('name').notNull(),
    path: text('path').notNull(), // /document/project/resume.pdf 
    size: integer('size').notNull(),
    type: text('type').notNull(), // 'folder' | 'file'


    // storeage information
    fileUrl: text('file_url').notNull(), // url to access file form imagekit
    thumbnailUrl: text('thumbnail_url'),


    //onwership information
    userId: text('user_id').notNull(), // user who uploaded the file
    parentId: uuid('parent_id'), // parent folder id, null if root folder

    // file/folder flags
    isFolder: boolean('is_folder').notNull().default(false), // true if folder, false if file
    isStarred: boolean('is_starred').notNull().default(false), // true if file is starred, false if not
    isTrash: boolean('is_trash').notNull().default(false), // true if file is in trash, false if not

    // timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(), // timestamp when file was created
    updatedAt: timestamp('updated_at').defaultNow().notNull(), // timestamp when file was last updated
})

// parent: each file/folder can have one parent folder
// children: each file/folder can have many child files/folders

export const filesRelations = relations(files, ({ one, many }) => ({
    parent: one(files, {
        fields: [files.parentId],
        references: [files.id],
    }),

    // realtionshi to child file/folder
    children: many(files)
}))

// type definations 
export type File = typeof files.$inferSelect; // 
export type NewFile = typeof files.$inferInsert; 