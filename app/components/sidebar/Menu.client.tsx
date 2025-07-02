import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { menuStore } from '~/lib/stores/menu';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { getAll, chatId, type ChatHistoryItem, deleteById } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { logger } from '~/utils/logger';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';

const menuVariants = {
  closed: {
    opacity: 0,
    visibility: 'hidden',
    x: '-100%',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    visibility: 'initial',
    x: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type DialogContent = { type: 'delete'; item: ChatHistoryItem } | null;

export function Menu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const open = useStore(menuStore);

  const loadEntries = useCallback(() => {
    getAll()
      .then((list) => list.filter((item) => item.urlId && item.description))
      .then(setList)
      .catch((error) => toast.error(error.message));
  }, []);

  const deleteItem = useCallback((event: React.UIEvent, item: ChatHistoryItem) => {
    event.preventDefault();

    deleteById(item.id)
      .then(() => {
        loadEntries();

        if (chatId.get() === item.id) {
          // hard page navigation to clear the stores
          window.location.pathname = '/';
        }
      })
      .catch((error) => {
        toast.error('Failed to delete conversation');
        logger.error(error);
      });
  }, []);

  const closeDialog = () => {
    setDialogContent(null);
  };

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open]);

  return (
    <>
      <div className="fixed top-6 left-5 z-[60] text-gray-200" style={{ display: open ? 'none' : 'block' }}>
        <div
          className="i-ph:sidebar-simple-duotone text-4xl cursor-pointer hover:text-gray-100 "
          onClick={() => menuStore.set(true)}
        />
      </div>
      <motion.div
        ref={menuRef}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={menuVariants}
        className="flex flex-col side-menu fixed top-0 w-[280px] h-full bg-[#202123] z-sidebar text-sm"
      >
        <div className="flex items-center justify-between h-[var(--header-height)] px-4 py-4 border-b border-gray-800">
          <div
            className="i-ph:sidebar-simple-duotone text-3xl cursor-pointer text-gray-400 hover:text-gray-200"
            onClick={() => menuStore.set(false)}
          />
        </div>
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          <div className="p-4">
            <a
              href="/"
              className="flex gap-2 items-center text-gray-200 hover:bg-gray-700 rounded-md p-2 transition-all duration-200"
            >
              <span className="inline-block i-idem:chat scale-110" />
              Start new chat
            </a>
          </div>
          <div className="text-gray-500 font-medium px-3 my-2">7 jours précédents</div>
          <div className="flex-1 overflow-y-auto px-2 pb-5">
            {list.length === 0 && <div className="px-3 text-gray-500">No previous conversations</div>}
            <DialogRoot open={dialogContent !== null}>
              {binDates(list).map(({ category, items }) => (
                <div key={category} className="mt-4 first:mt-0 space-y-1">
                  <div className="text-gray-500 sticky top-0 z-1 bg-[#202123] px-3 pt-2 pb-1">{category}</div>
                  {items.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onDelete={() => setDialogContent({ type: 'delete', item })}
                    />
                  ))}
                </div>
              ))}
              <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
                {dialogContent?.type === 'delete' && (
                  <>
                    <DialogTitle>Delete Chat?</DialogTitle>
                    <DialogDescription asChild>
                      <div>
                        <p>
                          You are about to delete <strong>{dialogContent.item.description}</strong>.
                        </p>
                        <p className="mt-1">Are you sure you want to delete this chat?</p>
                      </div>
                    </DialogDescription>
                    <div className="px-5 pb-4 bg-idem-elements-background-depth-2 flex gap-2 justify-end">
                      <DialogButton type="secondary" onClick={closeDialog}>
                        Cancel
                      </DialogButton>
                      <DialogButton
                        type="danger"
                        onClick={(event) => {
                          deleteItem(event, dialogContent.item);
                          closeDialog();
                        }}
                      >
                        Delete
                      </DialogButton>
                    </div>
                  </>
                )}
              </Dialog>
            </DialogRoot>
          </div>
          <div className="flex items-center border-t border-gray-800 p-4">
            <ThemeSwitch className="ml-auto" />
          </div>
        </div>
      </motion.div>
    </>
  );
}
