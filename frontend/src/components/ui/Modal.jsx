import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import useThemeStore from '../../store/themeStore';

export default function Modal({ isOpen, onClose, title, children }) {
  const { isDark } = useThemeStore();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className={clsx(
                'w-full max-w-lg transform overflow-hidden rounded-[2.5rem] p-8 text-left align-middle shadow-2xl transition-all border',
                isDark ? 'bg-[#1a1628] border-white/5 shadow-black/50' : 'bg-white border-gray-100 shadow-xl'
              )}>
                <div className="flex items-center justify-between mb-6">
                  {title && (
                    <Dialog.Title
                      as="h3"
                      className={clsx('text-2xl font-black tracking-tight', isDark ? 'text-white' : 'text-gray-900')}
                    >
                      {title}
                    </Dialog.Title>
                  )}
                  <button
                    type="button"
                    aria-label="Close modal"
                    onClick={onClose}
                    className={clsx(
                      'p-2 rounded-xl transition-colors ml-auto',
                      isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
