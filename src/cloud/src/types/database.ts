// Database types for Supabase
// The cloud is STATELESS - only auth/device ownership is stored here
// Settings and shot history are stored on the ESP32

export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          firmware_version: string | null;
          hardware_version: string | null;
          machine_type: string | null;
          is_online: boolean;
          last_seen_at: string | null;
          claimed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          owner_id?: string | null;
          name?: string;
          firmware_version?: string | null;
          hardware_version?: string | null;
          machine_type?: string | null;
          is_online?: boolean;
          last_seen_at?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          firmware_version?: string | null;
          hardware_version?: string | null;
          machine_type?: string | null;
          is_online?: boolean;
          last_seen_at?: string | null;
          claimed_at?: string | null;
          updated_at?: string;
        };
      };
      device_claim_tokens: {
        Row: {
          id: string;
          device_id: string;
          token_hash: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          token_hash: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          device_id?: string;
          token_hash?: string;
          expires_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type Device = Database['public']['Tables']['devices']['Row'];
export type DeviceInsert = Database['public']['Tables']['devices']['Insert'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
