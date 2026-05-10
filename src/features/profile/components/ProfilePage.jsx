import { useUser } from "../../auth/hooks/useUser";
import { useGetUserGroups } from "../../groups/hooks/useGetUserGroups";
import { signOut } from "../../../services/auth.service";
import GroupCard from "../../groups/components/GroupCard";
import ProfileAvatar from "./ProfileAvatar";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { data: session, isLoading: isUserLoading } = useUser();
  const user = session?.user;
  const navigate = useNavigate();

  const { data: groups, isLoading: isGroupsLoading } = useGetUserGroups(user?.id);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#000000]">
        <div className="w-12 h-12 border-4 border-[#0071e3]/20 border-t-[#0071e3] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] py-10 px-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-black dark:text-white tracking-tighter leading-[0.85] mb-6">
            Your <br /><span className="text-[#0071e3]">Profile.</span>
          </h1>
          <p className="text-sm md:text-lg text-gray-500 dark:text-gray-400 font-medium max-w-xl">
            Manage your account details and view the communities you've launched.
          </p>
        </div>

        {/* Account Information Section */}
        <section className="mb-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] mb-4">
              Account Information
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Your personal details and contact information. Manage how you appear to others.
            </p>
          </div>
          <div className="lg:col-span-2 bg-[#f5f5f7] dark:bg-[#111111] rounded-[40px] p-10 md:p-16 space-y-10">
            {/* Profile Avatar */}
            <div className="flex justify-center pb-6 border-b border-gray-200 dark:border-white/5">
              <ProfileAvatar user={user} />
            </div>

            <div className="grid grid-cols-1  md:grid-cols-2 gap-10">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Display Name</p>
                <p className="text-xl font-bold text-black dark:text-white">
                  {user?.user_metadata?.display_name || "Not set"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email Address</p>
                <p className="text-xl font-bold text-black dark:text-white">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Phone Number</p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {user?.user_metadata?.phone_number || "Not set"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location</p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {[user?.user_metadata?.city, user?.user_metadata?.country].filter(Boolean).join(", ") || "Not set"}
                </p>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200 dark:border-white/5 flex flex-wrap gap-4">
               <button
                onClick={handleSignOut}
                className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold text-sm hover:opacity-80 transition-all active:scale-95 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>

        {/* User Groups Section */}
        <section>
          <div className="mb-12">
            <h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] mb-4">
              Your Groups
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tighter">
              Communities you lead.
            </h3>
          </div>

          {isGroupsLoading ? (
            <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#f5f5f7] dark:bg-[#111111] rounded-[32px] h-[400px] animate-pulse" />
              ))}
            </div>
          ) : groups?.length > 0 ? (
            <div className="grid grid-cols-1 mx-4 md:grid-cols-2  place-items-center lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <div className="bg-[#f5f5f7] dark:bg-[#111111] rounded-[40px] p-20 text-center">
              <p className="text-2xl font-bold text-gray-400 dark:text-gray-600 mb-8">You haven't created any groups yet.</p>
              <button
                onClick={() => navigate("/create")}
                className="bg-[#0071e3] text-white px-10 py-5 rounded-full font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#0071e3]/20 cursor-pointer"
              >
                Launch your first channel
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
