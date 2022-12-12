/*
 * Copyright 2022 Nordeck IT + Consulting GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createContext,
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type EditModeContextType = {
  canEditGrid: boolean;
  setCanEditGrid: Dispatch<SetStateAction<boolean>>;
};

export const EditModeContext = createContext<EditModeContextType | undefined>(
  undefined
);

/**
 * Hook for accessing the edit context.
 *
 * @remarks Can only be called inside a `EditModeProvider`.
 *
 * @returns A reference of {@link EditModeContextType}.
 */
export const useEditMode = (): EditModeContextType => {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within a EditModeProvider');
  }
  return context;
};

/**
 * Provide a context that holds the state of the edit mode.
 */
export function EditModeProvider({
  children,
  enableEdit,
}: {
  children: ReactNode;
  enableEdit?: boolean;
}) {
  const [canEditGrid, setCanEditGrid] = useState(enableEdit ?? false);
  const value = useMemo<EditModeContextType>(
    () => ({ canEditGrid, setCanEditGrid }),
    [canEditGrid]
  );

  useEffect(() => {
    if (enableEdit !== undefined) {
      setCanEditGrid(enableEdit);
    }
  }, [enableEdit]);

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}

/**
 * Only render children if edit mode is enabled.
 */
export function EditModeGuard({ children }: PropsWithChildren<{}>) {
  const { canEditGrid } = useEditMode();

  if (canEditGrid) {
    return <>{children}</>;
  }

  return null;
}
