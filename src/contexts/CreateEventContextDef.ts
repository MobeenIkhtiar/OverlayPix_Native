import { createContext } from 'react';
import type { CreateEventContextType } from '../types/createEvent';

// Create context
export const CreateEventContext = createContext<CreateEventContextType | undefined>(undefined); 