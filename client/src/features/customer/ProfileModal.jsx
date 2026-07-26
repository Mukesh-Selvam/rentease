import { useState } from 'react';
import { X, User as UserIcon, ShieldCheck, Mail, Phone, MapPin, Camera, FileCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/authService';

export const ProfileModal = ({ isOpen, onClose, onProfileUpdated }) => {
  const { currentUser, setCurrentUser } = useAuth();
  const { triggerToast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || 'Bengaluru');
  const [avatar, setAvatar] = useState(currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // KYC state
  const [docType, setDocType] = useState('Aadhaar Card');
  const [docUrl, setDocUrl] = useState(currentUser?.kycDocumentUrl || '');
  const [kycLoading, setKycLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // New address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [street, setStreet] = useState('');
  const [pincode, setPincode] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await authService.updateProfile({
        name,
        phone,
        city,
        avatar
      });
      setCurrentUser(res.user);
      triggerToast('Profile details updated successfully!');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmitKyc = async (e) => {
    e.preventDefault();
    setKycLoading(true);
    try {
      const res = await authService.submitKyc({
        documentType: docType,
        documentUrl: docUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
      });
      setCurrentUser({ ...currentUser, kycStatus: 'PENDING', kycDocumentUrl: res.user.kycDocumentUrl });
      triggerToast('KYC document submitted for verification!');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Failed to submit KYC document.', 'error');
    } finally {
      setKycLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const newAddress = {
        label: 'Home',
        street,
        city,
        state: 'Karnataka',
        pincode,
        isDefault: (currentUser.addresses || []).length === 0
      };
      const updatedAddresses = [...(currentUser.addresses || []), newAddress];
      const res = await authService.updateProfile({ addresses: updatedAddresses });
      setCurrentUser(res.user);
      triggerToast('New delivery address saved!');
      setShowAddAddress(false);
      setStreet('');
      setPincode('');
    } catch {
      triggerToast('Failed to add address.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={avatar}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-red-500 shadow-md"
              />
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter Profile Picture Image URL (JPEG/PNG/WebP):', avatar);
                  if (url) setAvatar(url);
                }}
                className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-1.5 rounded-full text-xs shadow-md hover:bg-red-500 transition-colors"
                title="Change Avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-2xl text-slate-900">{name || currentUser.name}</h3>
                <span className="bg-red-50 text-red-600 border border-red-200 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentUser.email} • {city}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Verification Badge */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          currentUser.kycStatus === 'VERIFIED'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : currentUser.kycStatus === 'PENDING'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-3">
            {currentUser.kycStatus === 'VERIFIED' ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : currentUser.kycStatus === 'PENDING' ? (
              <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            )}
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider">
                KYC Verification Status: {currentUser.kycStatus || 'NOT_SUBMITTED'}
              </h4>
              <p className="text-[11px] opacity-90 mt-0.5">
                {currentUser.kycStatus === 'VERIFIED'
                  ? 'Your profile is fully verified for high-value rental subscriptions.'
                  : currentUser.kycStatus === 'PENDING'
                  ? 'KYC document submitted! Admin review in progress.'
                  : 'Submit identity proof (Aadhaar / Passport) for instant rental approval.'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-500 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Primary City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 outline-none"
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md"
            >
              {profileLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* KYC Document Submission Section */}
        {currentUser.kycStatus !== 'VERIFIED' && (
          <form onSubmit={handleSubmitKyc} className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-red-500" />
              <span>Submit Identity Verification Document (KYC)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 outline-none"
                >
                  <option value="Aadhaar Card">Aadhaar Card (JPEG / PNG)</option>
                  <option value="Passport">Passport (JPEG / PNG)</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Document Image URL / File Link</label>
                <input
                  type="text"
                  placeholder="https://example.com/my-aadhaar.jpg"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={kycLoading}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-md transition-all"
            >
              {kycLoading ? 'Submitting...' : 'Upload & Submit KYC for Verification'}
            </button>
          </form>
        )}

        {/* Address Book Management */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Saved Address Book</h4>
            <button
              type="button"
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="text-xs font-black text-red-500 hover:underline"
            >
              {showAddAddress ? 'Cancel' : '+ Add Address'}
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <input
                type="text"
                required
                placeholder="Street Address / Flat Number"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
              />
              <input
                type="text"
                required
                placeholder="Pincode (e.g. 560102)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
              />
              <button
                type="submit"
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Save Address
              </button>
            </form>
          )}

          <div className="space-y-2">
            {(currentUser.addresses || []).length === 0 ? (
              <p className="text-xs text-slate-400">No saved addresses yet.</p>
            ) : (
              currentUser.addresses.map((addr, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-900 block">{addr.label || 'Home'} {addr.isDefault && '(Default)'}</strong>
                    <span className="text-slate-500 font-medium">{addr.street}, {addr.city} - {addr.pincode}</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase">
                    Serviceable
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
