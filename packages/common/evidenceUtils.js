/**
 * EPIC 4: Audit, Evidence, Lineage
 * Evidence Utilities - Common utilities for evidence management
 * 
 * This module provides utilities for handling evidence files,
 * including SHA256 hashing and chain of custody management.
 */

// Evidence action types
export const EvidenceActions = {
  CREATED: 'CREATED',
  VIEWED: 'VIEWED',
  DOWNLOADED: 'DOWNLOADED',
  VERIFIED: 'VERIFIED',
  TRANSFERRED: 'TRANSFERRED',
  MARKED_FOR_DELETION: 'MARKED_FOR_DELETION',
  RESTORED: 'RESTORED',
  INTEGRITY_CHECK: 'INTEGRITY_CHECK',
  ACCESS_GRANTED: 'ACCESS_GRANTED',
  ACCESS_REVOKED: 'ACCESS_REVOKED',
  METADATA_UPDATED: 'METADATA_UPDATED'
};

/**
 * EvidenceUtils class for evidence management
 */
class EvidenceUtils {
  constructor(supabaseClient = null) {
    this.supabase = supabaseClient;
    this.defaultTenantId = null;
    this.storageBucket = 'evidence';
  }

  /**
   * Set the Supabase client
   * @param {Object} client - Supabase client instance
   */
  setClient(client) {
    this.supabase = client;
  }

  /**
   * Set the default tenant ID
   * @param {string} tenantId - Tenant UUID
   */
  setTenantId(tenantId) {
    this.defaultTenantId = tenantId;
  }

  /**
   * Set the storage bucket name
   * @param {string} bucket - Bucket name
   */
  setBucket(bucket) {
    this.storageBucket = bucket;
  }

  /**
   * Calculate SHA256 hash of a file or ArrayBuffer
   * @param {File|ArrayBuffer|Uint8Array} data - File data
   * @returns {Promise<string>} - Hex-encoded SHA256 hash
   */
  async calculateSHA256(data) {
    let buffer;
    
    if (data instanceof File) {
      buffer = await data.arrayBuffer();
    } else if (data instanceof ArrayBuffer) {
      buffer = data;
    } else if (data instanceof Uint8Array) {
      buffer = data.buffer;
    } else if (typeof data === 'string') {
      const encoder = new TextEncoder();
      buffer = encoder.encode(data).buffer;
    } else {
      throw new Error('Unsupported data type for hashing');
    }

    // Use Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Verify file integrity by comparing hash
   * @param {File|ArrayBuffer} data - File data
   * @param {string} expectedHash - Expected SHA256 hash
   * @returns {Promise<boolean>} - True if hash matches
   */
  async verifyIntegrity(data, expectedHash) {
    const actualHash = await this.calculateSHA256(data);
    return actualHash.toLowerCase() === expectedHash.toLowerCase();
  }

  /**
   * Generate a unique storage path for evidence
   * @param {string} tenantId - Tenant UUID
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {string} fileName - Original file name
   * @returns {string} - Storage path
   */
  generateStoragePath(tenantId, entityType, entityId, fileName) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const safeFileName = this.sanitizeFileName(fileName);
    
    return `${tenantId}/${entityType}/${entityId}/${timestamp}_${randomSuffix}_${safeFileName}`;
  }

  /**
   * Sanitize a file name for storage
   * @param {string} fileName - Original file name
   * @returns {string} - Sanitized file name
   */
  sanitizeFileName(fileName) {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/__+/g, '_')
      .substring(0, 200);
  }

  /**
   * Get MIME type from file extension
   * @param {string} fileName - File name
   * @returns {string} - MIME type
   */
  getMimeType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'txt': 'text/plain',
      'json': 'application/json',
      'xml': 'application/xml',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Upload evidence file
   * @param {Object} params - Upload parameters
   * @returns {Promise<Object>} - Upload result with evidence ID
   */
  async uploadEvidence(params) {
    const {
      file,
      tenantId = this.defaultTenantId,
      entityType,
      entityId,
      description = null,
      tags = [],
      uploadedBy,
      metadata = {}
    } = params;

    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    if (!file) {
      return { success: false, error: 'File is required' };
    }

    if (!tenantId || !entityType || !entityId || !uploadedBy) {
      return { success: false, error: 'tenantId, entityType, entityId, and uploadedBy are required' };
    }

    try {
      // Calculate SHA256 hash
      const sha256Hash = await this.calculateSHA256(file);

      // Generate storage path
      const fileName = file.name || 'evidence_file';
      const storagePath = this.generateStoragePath(tenantId, entityType, entityId, fileName);
      const mimeType = file.type || this.getMimeType(fileName);

      // Upload to storage
      const { error: uploadError } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(storagePath, file, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[EvidenceUtils] Storage upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(storagePath);

      const storageUrl = urlData?.publicUrl || storagePath;

      // Create evidence item record
      const evidenceItem = {
        tenant_id: tenantId,
        entity_type: entityType,
        entity_id: String(entityId),
        file_name: this.sanitizeFileName(fileName),
        original_file_name: fileName,
        mime_type: mimeType,
        file_size: file.size || null,
        storage_url: storageUrl,
        storage_bucket: this.storageBucket,
        storage_path: storagePath,
        sha256_hash: sha256Hash,
        description: description,
        tags: tags,
        uploaded_by: uploadedBy
      };

      const { data: evidenceData, error: evidenceError } = await this.supabase
        .schema('audit')
        .from('evidence_items')
        .insert([evidenceItem])
        .select('id')
        .single();

      if (evidenceError) {
        console.error('[EvidenceUtils] Evidence record creation error:', evidenceError);
        // Try to clean up uploaded file
        await this.supabase.storage.from(this.storageBucket).remove([storagePath]);
        return { success: false, error: evidenceError.message };
      }

      // Create initial chain of custody entry
      const chainEntry = {
        tenant_id: tenantId,
        evidence_id: evidenceData.id,
        action: EvidenceActions.CREATED,
        actor_user_id: uploadedBy,
        notes: 'Evidence file uploaded',
        hash_at_action: sha256Hash,
        metadata: metadata
      };

      const { error: chainError } = await this.supabase
        .schema('audit')
        .from('evidence_chain')
        .insert([chainEntry]);

      if (chainError) {
        console.warn('[EvidenceUtils] Warning: Failed to create chain entry:', chainError);
      }

      return {
        success: true,
        evidenceId: evidenceData.id,
        sha256Hash,
        storagePath,
        storageUrl
      };
    } catch (err) {
      console.error('[EvidenceUtils] Exception uploading evidence:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Add chain of custody entry
   * @param {Object} params - Chain entry parameters
   * @returns {Promise<Object>} - Result
   */
  async addChainEntry(params) {
    const {
      tenantId = this.defaultTenantId,
      evidenceId,
      action,
      actorUserId,
      actorRole = null,
      notes = null,
      metadata = {},
      ipAddress = null
    } = params;

    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    if (!evidenceId || !action || !actorUserId) {
      return { success: false, error: 'evidenceId, action, and actorUserId are required' };
    }

    try {
      // Get current evidence hash
      const { data: evidence, error: evidenceError } = await this.supabase
        .schema('audit')
        .from('evidence_items')
        .select('sha256_hash')
        .eq('id', evidenceId)
        .single();

      if (evidenceError) {
        return { success: false, error: 'Evidence item not found' };
      }

      // Get previous chain entry
      const { data: prevChain } = await this.supabase
        .schema('audit')
        .from('evidence_chain')
        .select('id')
        .eq('evidence_id', evidenceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const chainEntry = {
        tenant_id: tenantId,
        evidence_id: evidenceId,
        action: action,
        actor_user_id: actorUserId,
        actor_role: actorRole,
        notes: notes,
        previous_chain_id: prevChain?.id || null,
        hash_at_action: evidence.sha256_hash,
        metadata: metadata,
        ip_address: ipAddress
      };

      const { data, error } = await this.supabase
        .schema('audit')
        .from('evidence_chain')
        .insert([chainEntry])
        .select('id')
        .single();

      if (error) {
        console.error('[EvidenceUtils] Error adding chain entry:', error);
        return { success: false, error: error.message };
      }

      return { success: true, chainId: data.id };
    } catch (err) {
      console.error('[EvidenceUtils] Exception adding chain entry:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get evidence item by ID
   * @param {string} evidenceId - Evidence UUID
   * @returns {Promise<Object>} - Evidence data
   */
  async getEvidence(evidenceId) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await this.supabase
        .schema('audit')
        .from('evidence_items')
        .select('*')
        .eq('id', evidenceId)
        .eq('is_deleted', false)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get evidence chain of custody
   * @param {string} evidenceId - Evidence UUID
   * @returns {Promise<Object>} - Chain of custody entries
   */
  async getChainOfCustody(evidenceId) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized', data: [] };
    }

    try {
      const { data, error } = await this.supabase
        .schema('audit')
        .from('evidence_chain')
        .select('*')
        .eq('evidence_id', evidenceId)
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message, data: [] };
    }
  }

  /**
   * Get evidence for an entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Evidence items
   */
  async getEntityEvidence(entityType, entityId, options = {}) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized', data: [] };
    }

    try {
      let query = this.supabase
        .schema('audit')
        .from('evidence_items')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('is_deleted', false);

      if (options.tenantId) {
        query = query.eq('tenant_id', options.tenantId);
      }

      const limit = options.limit || 50;
      query = query.order('uploaded_at', { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message, data: [] };
    }
  }

  /**
   * Verify evidence integrity
   * @param {string} evidenceId - Evidence UUID
   * @param {string} actorUserId - Actor performing verification
   * @returns {Promise<Object>} - Verification result
   */
  async verifyEvidenceIntegrity(evidenceId, actorUserId) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      // Get evidence record
      const { data: evidence, error: evidenceError } = await this.supabase
        .schema('audit')
        .from('evidence_items')
        .select('*')
        .eq('id', evidenceId)
        .single();

      if (evidenceError || !evidence) {
        return { success: false, error: 'Evidence not found' };
      }

      // Download file from storage
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from(evidence.storage_bucket)
        .download(evidence.storage_path);

      if (downloadError) {
        return { success: false, error: 'Failed to download evidence file' };
      }

      // Calculate current hash
      const currentHash = await this.calculateSHA256(await fileData.arrayBuffer());
      const isValid = currentHash.toLowerCase() === evidence.sha256_hash.toLowerCase();

      // Add verification chain entry
      await this.addChainEntry({
        tenantId: evidence.tenant_id,
        evidenceId: evidenceId,
        action: EvidenceActions.INTEGRITY_CHECK,
        actorUserId: actorUserId,
        notes: isValid ? 'Integrity verified - hash matches' : 'INTEGRITY FAILURE - hash mismatch',
        metadata: {
          expectedHash: evidence.sha256_hash,
          actualHash: currentHash,
          verified: isValid
        }
      });

      // Update verified timestamp if valid
      if (isValid) {
        await this.supabase
          .schema('audit')
          .from('evidence_items')
          .update({
            verified_at: new Date().toISOString(),
            verified_by: actorUserId
          })
          .eq('id', evidenceId);
      }

      return {
        success: true,
        isValid,
        expectedHash: evidence.sha256_hash,
        actualHash: currentHash
      };
    } catch (err) {
      console.error('[EvidenceUtils] Exception verifying evidence:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Soft delete evidence
   * @param {string} evidenceId - Evidence UUID
   * @param {string} actorUserId - Actor performing deletion
   * @param {string} reason - Deletion reason
   * @returns {Promise<Object>} - Result
   */
  async softDeleteEvidence(evidenceId, actorUserId, reason = null) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      // Get evidence for tenant_id
      const { data: evidence } = await this.supabase
        .schema('audit')
        .from('evidence_items')
        .select('tenant_id')
        .eq('id', evidenceId)
        .single();

      if (!evidence) {
        return { success: false, error: 'Evidence not found' };
      }

      // Update evidence record
      const { error: updateError } = await this.supabase
        .schema('audit')
        .from('evidence_items')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: actorUserId,
          deletion_reason: reason
        })
        .eq('id', evidenceId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Add chain entry
      await this.addChainEntry({
        tenantId: evidence.tenant_id,
        evidenceId: evidenceId,
        action: EvidenceActions.MARKED_FOR_DELETION,
        actorUserId: actorUserId,
        notes: reason || 'Evidence marked for deletion',
        metadata: { reason }
      });

      return { success: true };
    } catch (err) {
      console.error('[EvidenceUtils] Exception deleting evidence:', err);
      return { success: false, error: err.message };
    }
  }
}

// Create singleton instance
const evidenceUtils = new EvidenceUtils();

// Export singleton and class
export { EvidenceUtils };
export default evidenceUtils;
