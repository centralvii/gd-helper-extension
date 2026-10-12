import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChecklistPage } from './ChecklistPage';
import '@fontsource-variable/inter';
import '../index.css';
import { installIconTapAnimation } from '../utils/iconTapAnimation';

installIconTapAnimation();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChecklistPage />
  </React.StrictMode>
);
