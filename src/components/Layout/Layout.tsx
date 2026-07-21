import React from 'react';
import styles from './Layout.module.scss';
import Sidebar from '../Sidebar';
import MainChat from '../MainChat';

const Layout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <MainChat />
    </div>
  );
};

export default Layout;
