import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { menuStore } from '~/lib/stores/menu';
import { userStore } from '~/lib/stores/user';
import { classNames } from '~/utils/classNames';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { useEffect, useState } from 'react';
import { currentUser } from '~/lib/persistence/db';

export function Header() {
  const chat = useStore(chatStore);
  const open = useStore(menuStore);
  const user = useStore(userStore);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    userStore.set(currentUser);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownOpen && !(event.target as HTMLElement).closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header
      className={classNames('flex items-center mt-[1px] p-10 h-[var(--header-height)]', {
        'ml-[280px]': open,
        'ml-6': !open,
      })}
    >
      <div className="flex-1 flex items-center gap-4 z-logo text-gray-200">
        <div>
          <h1 className="text-4xl font-bold">LEXI WEBGEN</h1>
        </div>
        <div className="flex-1 px-4 text-center">
          <ClientOnly>{() => <ChatDescription />}</ClientOnly>
        </div>
      </div>
      <div className="relative">
        <div onClick={() => setDropdownOpen(!dropdownOpen)}>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profile'}
              className="w-10 h-10 rounded-full cursor-pointer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer text-gray-300">
              {user?.displayName?.[0] || user?.email?.[0] || '?'}
            </div>
          )}
        </div>
        <div
          className={`absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 user-dropdown ${dropdownOpen ? 'block' : 'hidden'}`}
        >
          <div className="px-4 py-2 border-b border-gray-700">
            <div className="text-sm font-medium text-gray-200">{user?.displayName || 'User'}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
          <a href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            Settings
          </a>
          <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Sign out</button>
        </div>
      </div>
    </header>
  );
}
