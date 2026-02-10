export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            blocks: {
                Row: {
                    content: string | null
                    created_at: string
                    document_id: string | null
                    id: string
                    position: number
                    props: Json | null
                    type: string
                    updated_at: string
                }
                Insert: {
                    content?: string | null
                    created_at?: string
                    document_id?: string | null
                    id?: string
                    position: number
                    props?: Json | null
                    type: string
                    updated_at?: string
                }
                Update: {
                    content?: string | null
                    created_at?: string
                    document_id?: string | null
                    id?: string
                    position?: number
                    props?: Json | null
                    type?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "blocks_document_id_fkey"
                        columns: ["document_id"]
                        isOneToOne: false
                        referencedRelation: "documents"
                        referencedColumns: ["id"]
                    }
                ]
            }
            documents: {
                Row: {
                    cover_image: string | null
                    created_at: string
                    icon: string | null
                    id: string
                    is_expanded: boolean | null
                    is_favorite: boolean
                    is_archived: boolean
                    is_published: boolean
                    is_full_width: boolean
                    is_small_text: boolean
                    is_locked: boolean
                    font_style: 'sans' | 'serif' | 'mono'
                    parent_id: string | null
                    position: number | null
                    title: string | null
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    cover_image?: string | null
                    created_at?: string
                    icon?: string | null
                    id?: string
                    is_expanded?: boolean | null
                    is_favorite?: boolean
                    is_archived?: boolean
                    is_published?: boolean
                    parent_id?: string | null
                    position?: number | null
                    title?: string | null
                    updated_at?: string
                    user_id?: string | null
                    is_full_width?: boolean
                    is_small_text?: boolean
                    is_locked?: boolean
                    font_style?: string
                }
                Update: {
                    cover_image?: string | null
                    created_at?: string
                    icon?: string | null
                    id?: string
                    is_expanded?: boolean | null
                    is_favorite?: boolean
                    is_archived?: boolean
                    is_published?: boolean
                    parent_id?: string | null
                    position?: number | null
                    title?: string | null
                    updated_at?: string
                    user_id?: string | null
                    is_full_width?: boolean
                    is_small_text?: boolean
                    is_locked?: boolean
                    font_style?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "documents_parent_id_fkey"
                        columns: ["parent_id"]
                        isOneToOne: false
                        referencedRelation: "documents"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "documents_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    display_name: string | null
                    email: string | null
                    id: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    email?: string | null
                    id: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    email?: string | null
                    id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
