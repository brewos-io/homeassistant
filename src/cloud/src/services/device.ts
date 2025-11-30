import { createHash, timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '../lib/supabase.js';
import type { Device, DeviceInsert } from '../types/database.js';

/**
 * Generate a hash for token comparison
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Create or update a claim token for a device
 * Called by ESP32 when generating QR code
 */
export async function createClaimToken(deviceId: string, token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert the claim token
  const { error } = await supabaseAdmin
    .from('device_claim_tokens')
    .upsert({
      device_id: deviceId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: 'device_id',
    });

  if (error) {
    console.error('[Device] Failed to create claim token:', error);
    throw new Error('Failed to create claim token');
  }
}

/**
 * Verify a claim token is valid
 */
export async function verifyClaimToken(deviceId: string, token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const { data, error } = await supabaseAdmin
    .from('device_claim_tokens')
    .select('token_hash, expires_at')
    .eq('device_id', deviceId)
    .single();

  if (error || !data) {
    return false;
  }

  // Check expiration
  if (new Date(data.expires_at) < new Date()) {
    return false;
  }

  // Constant-time comparison
  try {
    return timingSafeEqual(
      Buffer.from(tokenHash, 'hex'),
      Buffer.from(data.token_hash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Claim a device for a user
 */
export async function claimDevice(
  deviceId: string,
  userId: string,
  name?: string
): Promise<Device> {
  // Check if device exists
  const { data: existing } = await supabaseAdmin
    .from('devices')
    .select('id, owner_id')
    .eq('id', deviceId)
    .single();

  if (existing?.owner_id) {
    throw new Error('Device is already claimed');
  }

  // Upsert device with owner
  const deviceData: DeviceInsert = {
    id: deviceId,
    owner_id: userId,
    name: name || 'My BrewOS',
    claimed_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('devices')
    .upsert(deviceData)
    .select()
    .single();

  if (error) {
    console.error('[Device] Failed to claim device:', error);
    throw new Error('Failed to claim device');
  }

  // Delete the claim token
  await supabaseAdmin
    .from('device_claim_tokens')
    .delete()
    .eq('device_id', deviceId);

  return data;
}

/**
 * Get devices for a user
 */
export async function getUserDevices(userId: string): Promise<Device[]> {
  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Device] Failed to get devices:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single device by ID
 */
export async function getDevice(deviceId: string): Promise<Device | null> {
  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('*')
    .eq('id', deviceId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Check if user owns a device
 */
export async function userOwnsDevice(userId: string, deviceId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('devices')
    .select('id')
    .eq('id', deviceId)
    .eq('owner_id', userId)
    .single();

  return !!data;
}

/**
 * Update device online status
 */
export async function updateDeviceStatus(
  deviceId: string,
  isOnline: boolean,
  firmwareVersion?: string
): Promise<void> {
  const update: Partial<Device> = {
    is_online: isOnline,
    last_seen_at: new Date().toISOString(),
  };

  if (firmwareVersion) {
    update.firmware_version = firmwareVersion;
  }

  await supabaseAdmin
    .from('devices')
    .update(update)
    .eq('id', deviceId);
}

/**
 * Remove a device from user's account
 */
export async function removeDevice(deviceId: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('devices')
    .update({ owner_id: null, claimed_at: null })
    .eq('id', deviceId)
    .eq('owner_id', userId);

  if (error) {
    throw new Error('Failed to remove device');
  }
}

/**
 * Rename a device
 */
export async function renameDevice(
  deviceId: string,
  userId: string,
  name: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('devices')
    .update({ name })
    .eq('id', deviceId)
    .eq('owner_id', userId);

  if (error) {
    throw new Error('Failed to rename device');
  }
}

