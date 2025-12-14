/**
 * Users Page
 * EPIC 5 - Manage MDM user profiles
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, RefreshCw, User, Edit, Building, Check, Globe
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'demo-tenant-id';

const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [orgUnits, setOrgUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    home_org_unit_id: '',
    nationality_code: '',
    languages_json: [],
    skills_json: []
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadData = async () => {
    try {
      const [natRes, orgRes] = await Promise.all([
        fetch(`${API_BASE}/mdm/users/nationalities`, { headers: { 'x-tenant-id': TENANT_ID } }),
        fetch(`${API_BASE}/mdm/users/org-units`, { headers: { 'x-tenant-id': TENANT_ID } })
      ]);

      if (natRes.ok) {
        const data = await natRes.json();
        setNationalities(data.data || []);
      }

      if (orgRes.ok) {
        const data = await orgRes.json();
        setOrgUnits(data.data || []);
      }
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE}/mdm/users?${params}`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      home_org_unit_id: user.home_org_unit_id || '',
      nationality_code: user.nationality_code || '',
      languages_json: user.languages_json || [],
      skills_json: user.skills_json || []
    });
    setDialogOpen(true);
  };

  const saveProfile = async () => {
    if (!editingUser) return;
    
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/mdm/users/${editingUser.user_id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID
        },
        body: JSON.stringify({
          home_org_unit_id: formData.home_org_unit_id || null,
          nationality_code: formData.nationality_code || null,
          languages_json: formData.languages_json,
          skills_json: formData.skills_json
        })
      });

      if (res.ok) {
        setDialogOpen(false);
        loadUsers();
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error?.message || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const addLanguage = (lang) => {
    if (lang && !formData.languages_json.includes(lang)) {
      setFormData(prev => ({
        ...prev,
        languages_json: [...prev.languages_json, lang]
      }));
    }
  };

  const removeLanguage = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages_json: prev.languages_json.filter(l => l !== lang)
    }));
  };

  const addSkill = (skill) => {
    if (skill && !formData.skills_json.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills_json: [...prev.skills_json, skill]
      }));
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills_json: prev.skills_json.filter(s => s !== skill)
    }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage MDM user profiles (nationality, languages, skills)
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <Check className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Home Org Unit</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      {user.home_org_unit_name ? (
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{user.home_org_unit_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.nationality_name ? (
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span>{user.nationality_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.languages_json?.slice(0, 3).map(lang => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                        {user.languages_json?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{user.languages_json.length - 3}
                          </Badge>
                        )}
                        {(!user.languages_json || user.languages_json.length === 0) && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.user_status === 'active' ? 'default' : 'secondary'}>
                        {user.user_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Update MDM profile for {editingUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Home Org Unit</Label>
              <Select
                value={formData.home_org_unit_id}
                onValueChange={(v) => setFormData(prev => ({ ...prev, home_org_unit_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select org unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {orgUnits.map(ou => (
                    <SelectItem key={ou.id} value={ou.id}>
                      {ou.name} ({ou.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Select
                value={formData.nationality_code}
                onValueChange={(v) => setFormData(prev => ({ ...prev, nationality_code: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {nationalities.map(nat => (
                    <SelectItem key={nat.code} value={nat.code}>
                      {nat.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Languages</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.languages_json.map(lang => (
                  <Badge 
                    key={lang} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeLanguage(lang)}
                  >
                    {lang} ×
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Add language" />
                </SelectTrigger>
                <SelectContent>
                  {['Arabic', 'English', 'French', 'Urdu', 'Hindi', 'Filipino', 'Other'].map(lang => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.skills_json.map(skill => (
                  <Badge 
                    key={skill} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeSkill(skill)}
                  >
                    {skill} ×
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Add skill" />
                </SelectTrigger>
                <SelectContent>
                  {['Collections', 'Negotiation', 'Legal', 'Customer Service', 'Field Operations', 'Data Entry'].map(skill => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
