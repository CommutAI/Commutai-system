import { useState, useEffect } from 'react';
import { supabase } from "@commutai/supabase";
import { 
  User, Mail, Phone, Bus, Shield, LogOut, 
  Key, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import type { DriverProfile } from '../types';

export default function DriverProfile() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: staffData } = await (supabase
        .from('staff_users')
        .select('*')
        .eq('email', 'driver@commutai.test') // Using actual driver email from database
        .single() as any);

      if (staffData) {
        const profileData: DriverProfile = {
          id: staffData.id,
          full_name: staffData.full_name,
          email: staffData.email,
          phone_number: staffData.phone_number,
          bus_id: staffData.bus_id,
          license_number: staffData.license_number,
          license_expiry: staffData.license_expiry,
          emergency_contact: staffData.emergency_contact,
          emergency_phone: staffData.emergency_phone,
          current_status: staffData.is_active ? 'Active' : 'Inactive',
          account_status: staffData.is_active ? 'Active' : 'Inactive',
          created_at: staffData.created_at
        };
        setProfile(profileData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);

      // Log activity
      if (profile) {
        await (supabase
          .from('activity_logs') as any)
          .insert({
            user_id: profile.id,
            action: 'password_changed',
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password. Please check your current password and try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (profile) {
        // Log activity
        await (supabase
          .from('activity_logs') as any)
          .insert({
            user_id: profile.id,
            action: 'logout',
            created_at: new Date().toISOString()
          });
      }

      await supabase.auth.signOut();
      // Redirect to driver login page
      window.location.href = '/driver/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card p-8 text-center">
        <User className="text-white/40 mx-auto mb-4" size={48} />
        <p className="text-white/60">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Driver Profile</h1>
        <p className="text-white/60">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center">
            <User className="text-orange-400" size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{profile.full_name}</h2>
            <p className="text-white/60">Driver</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="text-orange-400" size={20} />
              Personal Information
            </h3>
            
            <div className="flex items-center gap-3">
              <Mail className="text-white/60" size={18} />
              <div>
                <p className="text-white/60 text-sm">Email</p>
                <p className="text-white">{profile.email}</p>
              </div>
            </div>

            {profile.phone_number && (
              <div className="flex items-center gap-3">
                <Phone className="text-white/60" size={18} />
                <div>
                  <p className="text-white/60 text-sm">Phone Number</p>
                  <p className="text-white">{profile.phone_number}</p>
                </div>
              </div>
            )}

            {profile.license_number && (
              <div className="flex items-center gap-3">
                <User className="text-white/60" size={18} />
                <div>
                  <p className="text-white/60 text-sm">License Number</p>
                  <p className="text-white">{profile.license_number}</p>
                </div>
              </div>
            )}

            {profile.emergency_contact && (
              <div className="flex items-center gap-3">
                <User className="text-white/60" size={18} />
                <div>
                  <p className="text-white/60 text-sm">Emergency Contact</p>
                  <p className="text-white">{profile.emergency_contact}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Clock className="text-white/60" size={18} />
              <div>
                <p className="text-white/60 text-sm">Member Since</p>
                <p className="text-white">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bus className="text-orange-400" size={20} />
              Work Information
            </h3>
            
            {profile.bus_id && (
              <div className="flex items-center gap-3">
                <Bus className="text-white/60" size={18} />
                <div>
                  <p className="text-white/60 text-sm">Assigned Bus</p>
                  <p className="text-white">{profile.bus_id}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Shield className="text-white/60" size={18} />
              <div>
                <p className="text-white/60 text-sm">Current Status</p>
                <p className={`font-medium ${profile.current_status === 'Active' ? 'text-green-400' : 'text-gray-400'}`}>
                  {profile.current_status}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="text-white/60" size={18} />
              <div>
                <p className="text-white/60 text-sm">Account Status</p>
                <p className={`font-medium ${profile.account_status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                  {profile.account_status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
        
        <div className="space-y-3">
          <button
            onClick={() => setShowPasswordChange(true)}
            className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <Key className="text-orange-400" size={20} />
            <div>
              <p className="text-white font-medium">Change Password</p>
              <p className="text-white/60 text-sm">Update your account password</p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors text-left"
          >
            <LogOut className="text-red-400" size={20} />
            <div>
              <p className="text-white font-medium">Logout</p>
              <p className="text-white/60 text-sm">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Key className="text-orange-400" size={24} />
              Change Password
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="Confirm new password"
                />
              </div>

              {passwordError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-red-400" size={16} />
                    <p className="text-red-400 text-sm">{passwordError}</p>
                  </div>
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={16} />
                    <p className="text-green-400 text-sm">{passwordSuccess}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="flex-1 primary-btn primary-btn--secondary"
                  disabled={changingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 primary-btn primary-btn--primary"
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Information Card */}
      <div className="glass-card p-4 border border-orange-500/30">
        <div className="flex items-start gap-3">
          <Shield className="text-orange-400 size={20} flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium mb-1">Account Security</p>
            <p className="text-white/60 text-sm">
              Drivers can view their profile and change their password. Role changes and permission modifications
              must be performed by system administrators. Contact your supervisor for account-related requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}