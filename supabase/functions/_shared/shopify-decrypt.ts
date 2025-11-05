// Shopify Token Encryption/Decryption Utilities

export async function decryptToken(encryptedBase64: string): Promise<string> {
  const keyBase64 = Deno.env.get('SHOPIFY_ENCRYPTION_KEY');
  if (!keyBase64) {
    throw new Error('SHOPIFY_ENCRYPTION_KEY not configured');
  }

  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

export async function getShopifyToken(agentId: string, supabase: any): Promise<{ 
  token: string; 
  shop: string; 
} | null> {
  const { data } = await supabase
    .from('shopify_connections')
    .select('encrypted_access_token, shop_domain')
    .eq('agent_id', agentId)
    .eq('revoked', false)
    .single();

  if (!data) return null;

  const token = await decryptToken(data.encrypted_access_token);
  return { token, shop: data.shop_domain };
}
