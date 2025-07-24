import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Share2, Link, Mail, Users, Eye, Edit, Lock, Globe, Shield, Copy, Check, X,
  UserPlus, Download, QrCode, Calendar, Clock, AlertCircle, History, Code,
  MessageSquare, Facebook, Twitter, Linkedin, Settings, Trash2, RefreshCw,
  ExternalLink, UserCheck, UserX, Activity, FileText, Search, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

// Permission levels with more granular controls
const PERMISSION_LEVELS = {
  view: {
    label: 'View Only',
    description: 'Can view the dashboard',
    icon: Eye,
    color: 'text-blue-500',
    capabilities: ['view_dashboard', 'view_data']
  },
  comment: {
    label: 'Can Comment',
    description: 'Can view and add comments',
    icon: MessageSquare,
    color: 'text-yellow-500',
    capabilities: ['view_dashboard', 'view_data', 'add_comments']
  },
  edit: {
    label: 'Can Edit',
    description: 'Can modify widgets and layout',
    icon: Edit,
    color: 'text-green-500',
    capabilities: ['view_dashboard', 'view_data', 'add_comments', 'edit_widgets', 'edit_layout']
  },
  admin: {
    label: 'Admin',
    description: 'Full control including sharing',
    icon: Shield,
    color: 'text-purple-500',
    capabilities: ['view_dashboard', 'view_data', 'add_comments', 'edit_widgets', 'edit_layout', 'manage_sharing', 'delete_dashboard']
  }
};

// Share expiry options
const SHARE_EXPIRY_OPTIONS = [
  { value: 'never', label: 'Never expires' },
  { value: '1hour', label: '1 hour' },
  { value: '1day', label: '24 hours' },
  { value: '7days', label: '7 days' },
  { value: '30days', label: '30 days' },
  { value: '90days', label: '90 days' },
  { value: 'custom', label: 'Custom date' }
];

// Social platforms for sharing
const SOCIAL_PLATFORMS = [
  { name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { name: 'Twitter', icon: Twitter, color: 'text-sky-500' },
  { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' }
];

export function DashboardSharing({ dashboard, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('link');
  const [shareLink, setShareLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPermission, setFilterPermission] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkPermission, setBulkPermission] = useState('view');
  const [customMessage, setCustomMessage] = useState('');
  const [customExpiry, setCustomExpiry] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(false);
  
  // Share settings
  const [shareSettings, setShareSettings] = useState({
    allowViewersToShare: false,
    allowDownloading: true,
    showUserActivity: true,
    requireTwoFactor: false,
    watermarkEnabled: false,
    ipRestrictions: [],
    domainRestrictions: []
  });

  const [sharedUsers, setSharedUsers] = useState([
    {
      id: 1,
      name: 'Ahmed Al-Rashid',
      email: 'ahmed@kastle.com',
      avatar: null,
      permission: 'view',
      sharedAt: new Date(Date.now() - 86400000),
      lastAccessed: new Date(Date.now() - 3600000),
      status: 'active',
      accessCount: 12
    },
    {
      id: 2,
      name: 'Fatima Al-Zahra',
      email: 'fatima@kastle.com',
      avatar: null,
      permission: 'edit',
      sharedAt: new Date(Date.now() - 172800000),
      lastAccessed: new Date(Date.now() - 7200000),
      status: 'active',
      accessCount: 8
    },
    {
      id: 3,
      name: 'Omar Hassan',
      email: 'omar@kastle.com',
      avatar: null,
      permission: 'comment',
      sharedAt: new Date(Date.now() - 259200000),
      lastAccessed: null,
      status: 'pending',
      accessCount: 0
    }
  ]);

  const [activityLog, setActivityLog] = useState([
    {
      id: 1,
      user: 'Ahmed Al-Rashid',
      action: 'viewed dashboard',
      timestamp: new Date(Date.now() - 3600000),
      details: 'Accessed from Chrome on Windows'
    },
    {
      id: 2,
      user: 'Fatima Al-Zahra',
      action: 'edited widget',
      timestamp: new Date(Date.now() - 7200000),
      details: 'Modified Sales Chart widget'
    },
    {
      id: 3,
      user: 'System',
      action: 'share link generated',
      timestamp: new Date(Date.now() - 86400000),
      details: 'Public link created with 7-day expiry'
    }
  ]);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState('view');
  const [linkExpiry, setLinkExpiry] = useState('never');
  const [linkPassword, setLinkPassword] = useState('');
  const [requireAuth, setRequireAuth] = useState(true);

  // Generate share link
  const generateShareLink = async () => {
    const baseUrl = window.location.origin;
    const dashboardId = dashboard?.id || 'custom-dashboard';
    const token = btoa(JSON.stringify({
      dashboardId,
      permission: 'view',
      expiry: linkExpiry,
      password: linkPassword ? btoa(linkPassword) : null,
      requireAuth,
      createdAt: new Date().toISOString()
    }));
    
    const link = `${baseUrl}/shared-dashboard/${token}`;
    setShareLink(link);

    // Generate QR code
    try {
      const qr = await QRCode.toDataURL(link, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCode(qr);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    // Generate embed code
    const embedHtml = `<iframe src="${link}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
    setEmbedCode(embedHtml);

    // Log activity
    addActivityLog('share link generated', `Public link created with ${linkExpiry} expiry`);

    return link;
  };

  // Copy to clipboard with fallback
  const copyToClipboard = async (text, type = 'link') => {
    try {
      if (!text && type === 'link') {
        const link = await generateShareLink();
        await navigator.clipboard.writeText(link);
      } else {
        await navigator.clipboard.writeText(text);
      }
      
      setLinkCopied(true);
      toast.success(`${type === 'embed' ? 'Embed code' : 'Link'} copied to clipboard`);
      
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Add user to share list
  const addUser = () => {
    if (!newUserEmail || !validateEmail(newUserEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (sharedUsers.some(user => user.email === newUserEmail)) {
      toast.error('User already has access to this dashboard');
      return;
    }

    const newUser = {
      id: Date.now(),
      name: newUserEmail.split('@')[0],
      email: newUserEmail,
      avatar: null,
      permission: newUserPermission,
      sharedAt: new Date(),
      lastAccessed: null,
      status: 'pending',
      accessCount: 0
    };

    setSharedUsers([...sharedUsers, newUser]);
    setNewUserEmail('');
    toast.success(`Dashboard shared with ${newUserEmail}`);

    // Log activity
    addActivityLog('user invited', `${newUserEmail} invited with ${newUserPermission} permission`);

    // Send invitation email
    sendInvitationEmail(newUser);
  };

  // Bulk operations
  const handleBulkOperation = (operation) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    switch (operation) {
      case 'update-permission':
        setSharedUsers(sharedUsers.map(user => 
          selectedUsers.includes(user.id) 
            ? { ...user, permission: bulkPermission } 
            : user
        ));
        toast.success(`Updated permissions for ${selectedUsers.length} users`);
        break;
      
      case 'remove':
        setSharedUsers(sharedUsers.filter(user => !selectedUsers.includes(user.id)));
        toast.success(`Removed ${selectedUsers.length} users`);
        break;
      
      case 'resend-invite':
        const pendingUsers = sharedUsers.filter(user => 
          selectedUsers.includes(user.id) && user.status === 'pending'
        );
        pendingUsers.forEach(user => sendInvitationEmail(user));
        toast.success(`Resent invitations to ${pendingUsers.length} users`);
        break;
    }

    setSelectedUsers([]);
  };

  // Remove user from share list
  const removeUser = (userId) => {
    const user = sharedUsers.find(u => u.id === userId);
    setSharedUsers(sharedUsers.filter(user => user.id !== userId));
    toast.success('User access removed');
    
    // Log activity
    addActivityLog('user removed', `${user.email} access revoked`);
  };

  // Update user permission
  const updateUserPermission = (userId, permission) => {
    const user = sharedUsers.find(u => u.id === userId);
    setSharedUsers(sharedUsers.map(user => 
      user.id === userId ? { ...user, permission } : user
    ));
    toast.success('Permission updated');
    
    // Log activity
    addActivityLog('permission changed', `${user.email} permission changed to ${permission}`);
  };

  // Send invitation email (mock)
  const sendInvitationEmail = (user) => {
    console.log('Sending invitation email to:', user.email);
    // In a real app, this would trigger an email service
  };

  // Validate email
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Add activity log entry
  const addActivityLog = (action, details) => {
    const newEntry = {
      id: Date.now(),
      user: 'Current User',
      action,
      timestamp: new Date(),
      details
    };
    setActivityLog([newEntry, ...activityLog]);
  };

  // Share on social media
  const shareOnSocial = (platform) => {
    const url = encodeURIComponent(shareLink || window.location.href);
    const text = encodeURIComponent(`Check out this dashboard: ${dashboard?.name || 'Custom Dashboard'}`);
    
    const urls = {
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      Twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
    
    // Log activity
    addActivityLog('shared on social', `Shared on ${platform}`);
  };

  // Export share settings
  const exportShareSettings = () => {
    const settings = {
      dashboard: dashboard?.name || 'Custom Dashboard',
      isPublic,
      sharedUsers,
      shareLink,
      linkExpiry,
      requireAuth,
      shareSettings,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-share-settings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Share settings exported');
  };

  // Filter users
  const filteredUsers = sharedUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterPermission === 'all' || user.permission === filterPermission;
    return matchesSearch && matchesFilter;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Dashboard
          </DialogTitle>
          <DialogDescription>
            Share "{dashboard?.name || 'Custom Dashboard'}" with others
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Share Link
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users ({sharedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="link" className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Public Access</CardTitle>
                  <CardDescription>
                    Anyone with the link can view this dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="public-access">Enable public access</Label>
                    </div>
                    <Switch
                      id="public-access"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                  </div>

                  {isPublic && (
                    <>
                      <div className="space-y-2">
                        <Label>Share Link</Label>
                        <div className="flex gap-2">
                          <Input
                            value={shareLink}
                            readOnly
                            placeholder="Click generate to create link"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(shareLink)}
                            disabled={!shareLink}
                          >
                            {linkCopied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(shareLink, '_blank')}
                            disabled={!shareLink}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Link Expiry</Label>
                          <Select value={linkExpiry} onValueChange={setLinkExpiry}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SHARE_EXPIRY_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {linkExpiry === 'custom' && (
                            <Input
                              type="datetime-local"
                              value={customExpiry}
                              onChange={(e) => setCustomExpiry(e.target.value)}
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Password Protection</Label>
                          <Input
                            type="password"
                            placeholder="Optional password"
                            value={linkPassword}
                            onChange={(e) => setLinkPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="require-auth">Require authentication</Label>
                        </div>
                        <Switch
                          id="require-auth"
                          checked={requireAuth}
                          onCheckedChange={setRequireAuth}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Share Options</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {shareLink && (
                            <Card className="border-dashed">
                              <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                  <QrCode className="h-5 w-5 mx-auto text-muted-foreground" />
                                  <p className="text-sm font-medium">QR Code</p>
                                  {qrCode && (
                                    <img
                                      src={qrCode}
                                      alt="QR Code"
                                      className="mx-auto w-32 h-32"
                                    />
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                      const a = document.createElement('a');
                                      a.href = qrCode;
                                      a.download = 'dashboard-qr-code.png';
                                      a.click();
                                    }}
                                  >
                                    Download QR Code
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          <Card className="border-dashed">
                            <CardContent className="pt-6">
                              <div className="text-center space-y-4">
                                <Code className="h-5 w-5 mx-auto text-muted-foreground" />
                                <p className="text-sm font-medium">Embed Code</p>
                                <p className="text-xs text-muted-foreground">
                                  Embed this dashboard on your website
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setShowEmbedCode(!showEmbedCode)}
                                >
                                  {showEmbedCode ? 'Hide' : 'Show'} Embed Code
                                </Button>
                                {showEmbedCode && embedCode && (
                                  <div className="mt-2">
                                    <Textarea
                                      value={embedCode}
                                      readOnly
                                      className="font-mono text-xs"
                                      rows={3}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full mt-2"
                                      onClick={() => copyToClipboard(embedCode, 'embed')}
                                    >
                                      Copy Embed Code
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="space-y-2">
                          <Label>Share on Social Media</Label>
                          <div className="flex gap-2">
                            {SOCIAL_PLATFORMS.map((platform) => (
                              <Button
                                key={platform.name}
                                variant="outline"
                                size="sm"
                                onClick={() => shareOnSocial(platform.name)}
                                disabled={!shareLink}
                              >
                                <platform.icon className={cn("h-4 w-4", platform.color)} />
                                <span className="ml-2">{platform.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={generateShareLink}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {shareLink ? 'Regenerate Link' : 'Generate Share Link'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Share with Users</CardTitle>
                  <CardDescription>
                    Grant specific users access to this dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter email address"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addUser()}
                      />
                      <Select value={newUserPermission} onValueChange={setNewUserPermission}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <level.icon className={cn("h-4 w-4", level.color)} />
                                {level.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={addUser}>
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Custom Message (Optional)</Label>
                      <Textarea
                        placeholder="Add a personal message to the invitation email..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Search and filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Select value={filterPermission} onValueChange={setFilterPermission}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Permissions</SelectItem>
                        {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <level.icon className={cn("h-4 w-4", level.color)} />
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bulk actions */}
                  {selectedUsers.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <span>{selectedUsers.length} users selected</span>
                          <div className="flex gap-2">
                            <Select value={bulkPermission} onValueChange={setBulkPermission}>
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <level.icon className={cn("h-3 w-3", level.color)} />
                                      {level.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBulkOperation('update-permission')}
                            >
                              Update
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBulkOperation('resend-invite')}
                            >
                              Resend
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBulkOperation('remove')}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user.id]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  {user.name}
                                  {user.status === 'pending' && (
                                    <Badge variant="outline" className="text-xs">
                                      Pending
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Shared {formatDate(user.sharedAt)}
                                  </span>
                                  {user.lastAccessed && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Last seen {formatDate(user.lastAccessed)}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" />
                                    {user.accessCount} visits
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                value={user.permission}
                                onValueChange={(value) => updateUserPermission(user.id, value)}
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                        <level.icon className={cn("h-4 w-4", level.color)} />
                                        {level.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeUser(user.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sharing Settings</CardTitle>
                  <CardDescription>
                    Configure how this dashboard can be shared
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow viewers to share</Label>
                        <p className="text-sm text-muted-foreground">
                          Viewers can share this dashboard with others
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.allowViewersToShare}
                        onCheckedChange={(checked) => 
                          setShareSettings({ ...shareSettings, allowViewersToShare: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow downloading data</Label>
                        <p className="text-sm text-muted-foreground">
                          Users can export dashboard data
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.allowDownloading}
                        onCheckedChange={(checked) => 
                          setShareSettings({ ...shareSettings, allowDownloading: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show user activity</Label>
                        <p className="text-sm text-muted-foreground">
                          Track when users access the dashboard
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.showUserActivity}
                        onCheckedChange={(checked) => 
                          setShareSettings({ ...shareSettings, showUserActivity: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Require two-factor authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Users must have 2FA enabled to access
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.requireTwoFactor}
                        onCheckedChange={(checked) => 
                          setShareSettings({ ...shareSettings, requireTwoFactor: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable watermark</Label>
                        <p className="text-sm text-muted-foreground">
                          Show viewer's email as watermark on dashboard
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.watermarkEnabled}
                        onCheckedChange={(checked) => 
                          setShareSettings({ ...shareSettings, watermarkEnabled: checked })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Access Restrictions</h4>
                    
                    <div className="space-y-2">
                      <Label>IP Address Restrictions</Label>
                      <Textarea
                        placeholder="Enter IP addresses or ranges (one per line)"
                        rows={3}
                        value={shareSettings.ipRestrictions.join('\n')}
                        onChange={(e) => 
                          setShareSettings({ 
                            ...shareSettings, 
                            ipRestrictions: e.target.value.split('\n').filter(ip => ip.trim()) 
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Domain Restrictions</Label>
                      <Textarea
                        placeholder="Enter email domains (e.g., company.com)"
                        rows={3}
                        value={shareSettings.domainRestrictions.join('\n')}
                        onChange={(e) => 
                          setShareSettings({ 
                            ...shareSettings, 
                            domainRestrictions: e.target.value.split('\n').filter(domain => domain.trim()) 
                          })
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Permission Levels</Label>
                    <div className="space-y-2">
                      {Object.entries(PERMISSION_LEVELS).map(([key, level]) => (
                        <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <level.icon className={cn("h-5 w-5 mt-0.5", level.color)} />
                          <div className="flex-1">
                            <p className="font-medium">{level.label}</p>
                            <p className="text-sm text-muted-foreground">{level.description}</p>
                            <div className="mt-2">
                              <p className="text-xs font-medium mb-1">Capabilities:</p>
                              <div className="flex flex-wrap gap-1">
                                {level.capabilities.map((cap) => (
                                  <Badge key={cap} variant="secondary" className="text-xs">
                                    {cap.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 pr-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Log</CardTitle>
                  <CardDescription>
                    Recent sharing and access activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activityLog.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                        <div className="mt-0.5">
                          {entry.action.includes('viewed') && <Eye className="h-4 w-4 text-blue-500" />}
                          {entry.action.includes('edited') && <Edit className="h-4 w-4 text-green-500" />}
                          {entry.action.includes('shared') && <Share2 className="h-4 w-4 text-purple-500" />}
                          {entry.action.includes('removed') && <UserX className="h-4 w-4 text-red-500" />}
                          {entry.action.includes('invited') && <UserPlus className="h-4 w-4 text-yellow-500" />}
                          {entry.action.includes('generated') && <Link className="h-4 w-4 text-gray-500" />}
                          {entry.action.includes('permission') && <Shield className="h-4 w-4 text-orange-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{entry.user}</span>{' '}
                            {entry.action}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {entry.details}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={exportShareSettings}>
            <Download className="mr-2 h-4 w-4" />
            Export Settings
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to format dates
function formatDate(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}