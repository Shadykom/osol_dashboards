/**
 * User Profiles Routes
 * EPIC 5 - MDM User Profiles (operational, not auth)
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { queryWithTenant } from '../../db/index.js';

interface UserProfile {
  id: string;
  tenant_id: string;
  user_id: string;
  home_org_unit_id: string | null;
  nationality_code: string | null;
  languages_json: string[];
  skills_json: string[];
  preferences_json: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UserWithProfile {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  user_status: string;
  profile_id: string | null;
  home_org_unit_id: string | null;
  home_org_unit_name: string | null;
  nationality_code: string | null;
  nationality_name: string | null;
  languages_json: string[] | null;
  skills_json: string[] | null;
  preferences_json: Record<string, unknown> | null;
  profile_status: string | null;
}

export async function userProfileRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /mdm/users
   * List users with their MDM profiles
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { 
      search, 
      status,
      has_profile,
      limit = 50, 
      offset = 0 
    } = request.query as { 
      search?: string; 
      status?: string;
      has_profile?: string;
      limit?: number;
      offset?: number;
    };
    
    let sql = `
      SELECT 
        u.id as user_id, u.username, u.email, u.full_name, u.status as user_status,
        up.id as profile_id, up.home_org_unit_id, 
        ou.name as home_org_unit_name,
        up.nationality_code,
        (SELECT name_en FROM mdm.reference_data rd 
         WHERE rd.domain = 'NATIONALITY' AND rd.code = up.nationality_code 
         AND rd.tenant_id = u.tenant_id LIMIT 1) as nationality_name,
        up.languages_json, up.skills_json, up.preferences_json,
        up.status as profile_status
      FROM platform.users u
      LEFT JOIN mdm.user_profiles up ON up.user_id = u.id AND up.tenant_id = u.tenant_id
      LEFT JOIN platform.org_units ou ON ou.id = up.home_org_unit_id
      WHERE u.tenant_id = $1
    `;
    const params: unknown[] = [request.tenantId];
    
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (u.username ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`;
    }
    
    if (status) {
      params.push(status);
      sql += ` AND u.status = $${params.length}`;
    }
    
    if (has_profile === 'true') {
      sql += ' AND up.id IS NOT NULL';
    } else if (has_profile === 'false') {
      sql += ' AND up.id IS NULL';
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await queryWithTenant<{ total: number }>(request.tenantId, countSql, params);
    const total = countResult.rows[0]?.total || 0;
    
    // Add pagination
    sql += ` ORDER BY u.full_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await queryWithTenant<UserWithProfile>(request.tenantId, sql, params);
    
    return reply.send({
      success: true,
      data: result.rows,
      meta: {
        total,
        count: result.rowCount,
        limit: Number(limit),
        offset: Number(offset),
        requestId: request.requestId,
      },
    });
  });

  /**
   * GET /mdm/users/:user_id
   * Get a single user with their MDM profile
   */
  fastify.get('/:user_id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { user_id } = request.params as { user_id: string };
    
    const sql = `
      SELECT 
        u.id as user_id, u.username, u.email, u.full_name, u.status as user_status,
        u.created_at as user_created_at,
        up.id as profile_id, up.home_org_unit_id, 
        ou.name as home_org_unit_name, ou.type as home_org_unit_type,
        up.nationality_code,
        (SELECT name_en FROM mdm.reference_data rd 
         WHERE rd.domain = 'NATIONALITY' AND rd.code = up.nationality_code 
         AND rd.tenant_id = u.tenant_id LIMIT 1) as nationality_name,
        up.languages_json, up.skills_json, up.preferences_json,
        up.status as profile_status, up.created_at as profile_created_at, up.updated_at as profile_updated_at
      FROM platform.users u
      LEFT JOIN mdm.user_profiles up ON up.user_id = u.id AND up.tenant_id = u.tenant_id
      LEFT JOIN platform.org_units ou ON ou.id = up.home_org_unit_id
      WHERE u.id = $1 AND u.tenant_id = $2
    `;
    
    const result = await queryWithTenant<UserWithProfile>(request.tenantId, sql, [user_id, request.tenantId]);
    
    if (result.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * PATCH /mdm/users/:user_id/profile
   * Create or update user MDM profile
   */
  fastify.patch('/:user_id/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const { user_id } = request.params as { user_id: string };
    const body = request.body as {
      home_org_unit_id?: string | null;
      nationality_code?: string | null;
      languages_json?: string[];
      skills_json?: string[];
      preferences_json?: Record<string, unknown>;
      status?: 'active' | 'inactive';
    };
    
    // Check if user exists
    const userCheck = await queryWithTenant(
      request.tenantId,
      'SELECT id FROM platform.users WHERE id = $1 AND tenant_id = $2',
      [user_id, request.tenantId]
    );
    
    if (userCheck.rowCount === 0) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }
    
    // Upsert profile
    const sql = `
      INSERT INTO mdm.user_profiles (
        tenant_id, user_id, home_org_unit_id, nationality_code, 
        languages_json, skills_json, preferences_json, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET
        home_org_unit_id = COALESCE($3, mdm.user_profiles.home_org_unit_id),
        nationality_code = COALESCE($4, mdm.user_profiles.nationality_code),
        languages_json = COALESCE($5, mdm.user_profiles.languages_json),
        skills_json = COALESCE($6, mdm.user_profiles.skills_json),
        preferences_json = COALESCE($7, mdm.user_profiles.preferences_json),
        status = COALESCE($8, mdm.user_profiles.status)
      RETURNING id, tenant_id, user_id, home_org_unit_id, nationality_code,
                languages_json, skills_json, preferences_json, status, created_at, updated_at
    `;
    
    const params = [
      request.tenantId,
      user_id,
      body.home_org_unit_id !== undefined ? body.home_org_unit_id : null,
      body.nationality_code !== undefined ? body.nationality_code : null,
      body.languages_json ? JSON.stringify(body.languages_json) : null,
      body.skills_json ? JSON.stringify(body.skills_json) : null,
      body.preferences_json ? JSON.stringify(body.preferences_json) : null,
      body.status || 'active',
    ];
    
    const result = await queryWithTenant<UserProfile>(request.tenantId, sql, params);
    
    return reply.send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * GET /mdm/users/nationalities
   * Get list of available nationalities
   */
  fastify.get('/nationalities', async (request: FastifyRequest, reply: FastifyReply) => {
    const sql = `
      SELECT code, name_ar, name_en, extra_json
      FROM mdm.reference_data
      WHERE domain = 'NATIONALITY' AND status = 'active'
      ORDER BY sort_order, name_en
    `;
    
    const result = await queryWithTenant(request.tenantId, sql);
    
    return reply.send({
      success: true,
      data: result.rows,
    });
  });

  /**
   * GET /mdm/users/org-units
   * Get list of available org units for assignment
   */
  fastify.get('/org-units', async (request: FastifyRequest, reply: FastifyReply) => {
    const sql = `
      SELECT id, name, type, parent_id, status
      FROM platform.org_units
      WHERE tenant_id = $1 AND status = 'active'
      ORDER BY type, name
    `;
    
    const result = await queryWithTenant(request.tenantId, sql, [request.tenantId]);
    
    return reply.send({
      success: true,
      data: result.rows,
    });
  });
}
