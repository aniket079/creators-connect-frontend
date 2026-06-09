import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  updateProfile
} from "../api/userApi";
import useAuth from "../hooks/useAuth";
import { errorToast, successToast } from "../utils/toast";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false
};

const requiredAddressFields = [
  "fullName",
  "phone",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "country"
];

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const { setAuthenticatedUser } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    bio: "",
    avatarUrl: ""
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const avatarPreview = useMemo(
    () =>
      avatarFile
        ? URL.createObjectURL(avatarFile)
        : profile.avatarUrl || user?.avatar || user?.profileImage || user?.avatarUrl,
    [avatarFile, profile.avatarUrl, user]
  );

  useEffect(() => {
    if (!user) return;

    setProfile({
      name: user.name || "",
      phone: user.phone || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || ""
    });
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data.addresses || data || []);
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to load addresses");
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      const payload = avatarFile ? new FormData() : profile;

      if (avatarFile) {
        payload.append("name", profile.name);
        payload.append("phone", profile.phone);
        payload.append("bio", profile.bio);
        payload.append("avatar", avatarFile);
      }

      const data = await updateProfile(payload);
      setAuthenticatedUser(data.user);
      setAvatarFile(null);
      successToast("Profile updated");
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const validateAddress = () => {
    const missingField = requiredAddressFields.find((field) => !addressForm[field]?.trim());

    if (missingField) {
      errorToast("Please fill all required address fields");
      return false;
    }

    return true;
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    if (!validateAddress()) return;

    try {
      setSavingAddress(true);

      if (editingAddressId) {
        await updateAddress(editingAddressId, addressForm);
        successToast("Address updated");
      } else {
        await createAddress(addressForm);
        successToast("Address added");
      }

      setAddressForm(emptyAddress);
      setEditingAddressId("");
      fetchAddresses();
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const startEditAddress = (address) => {
    setEditingAddressId(address._id);
    setAddressForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "India",
      isDefault: Boolean(address.isDefault)
    });
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId);
      successToast("Address deleted");
      fetchAddresses();
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to delete address");
    }
  };

  const handleDefaultAddress = async (addressId) => {
    try {
      await setDefaultAddress(addressId);
      successToast("Default address updated");
      fetchAddresses();
    } catch (error) {
      errorToast(error.response?.data?.message || "Unable to update default address");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <section className="cc-panel rounded-lg p-6">
        <div className="rounded-lg bg-slate-950 p-5 text-white">
          <div className="flex items-center gap-4">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={profile.name || "Profile"}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-white/10"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-300 text-2xl font-black text-slate-950 ring-4 ring-white/10">
                {(profile.name || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">
                Public profile
              </p>
              <h2 className="truncate text-2xl font-black">
                {profile.name || "Creator"}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                This photo appears in the navbar, asset cards, and artist profile.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
          <input
            value={profile.name}
            onChange={(event) => setProfile({ ...profile, name: event.target.value })}
            className="cc-input"
            placeholder="Name"
            required
          />
          <input
            value={profile.phone}
            onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
            className="cc-input"
            placeholder="Phone"
          />
          <textarea
            value={profile.bio}
            onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
            rows="4"
            className="cc-input"
            placeholder="Bio"
          />
          <input
            value={profile.avatarUrl}
            onChange={(event) => setProfile({ ...profile, avatarUrl: event.target.value })}
            className="cc-input"
            placeholder="Avatar URL"
            disabled={Boolean(avatarFile)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-600"
          />
          <button
            type="submit"
            disabled={savingProfile}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      <section className="cc-panel rounded-lg p-6">
        <h2 className="text-2xl font-bold text-slate-950">Delivery Addresses</h2>

        <form onSubmit={handleAddressSubmit} className="mt-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["fullName", "Full name"],
              ["phone", "Phone"],
              ["addressLine1", "Address line 1"],
              ["addressLine2", "Address line 2"],
              ["city", "City"],
              ["state", "State"],
              ["postalCode", "Postal code"],
              ["country", "Country"]
            ].map(([field, label]) => (
              <input
                key={field}
                value={addressForm[field]}
                onChange={(event) =>
                  setAddressForm({ ...addressForm, [field]: event.target.value })
                }
                className="cc-input"
                placeholder={label}
                required={requiredAddressFields.includes(field)}
              />
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(event) =>
                setAddressForm({ ...addressForm, isDefault: event.target.checked })
              }
            />
            Set as default address
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={savingAddress}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {editingAddressId ? "Update Address" : "Add Address"}
            </button>
            {editingAddressId && (
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId("");
                  setAddressForm(emptyAddress);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {addresses.map((address) => (
            <div key={address._id} className="rounded-lg border border-slate-200 bg-white/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">
                    {address.fullName}
                    {address.isDefault && (
                      <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  </p>
                  <p className="text-sm text-slate-600">
                    {address.city}, {address.state} {address.postalCode}, {address.country}
                  </p>
                  <p className="text-sm text-slate-500">{address.phone}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEditAddress(address)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDefaultAddress(address._id)}
                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    Set Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(address._id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Profile;
