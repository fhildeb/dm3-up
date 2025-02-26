import { screen, render } from '@testing-library/react';
import { Contacts } from './Contacts';
import '@testing-library/jest-dom';

describe('Contacts test cases', () => {
    const props = {
        getContacts: {} as any,
        dm3Props: {
            config: {
                showContacts: true,
                inline: true,
                defaultStorageLocation: '' as any,
                hideStorageSelection: true,
                style: '' as any,
                defaultServiceUrl: '',
                showAlways: true,
                miniSignIn: true,
                warnBeforeLeave: false,
                browserStorageBackup: false,
                showHelp: false,
                theme: 'dark',
                ethereumProvider: 'goerli',
                walletConnectProjectId: 'dadsa',
            },
        },
    };

    it('Renders Contacts component', () => {
        render(<Contacts {...props} />);
        expect(screen.getByText('Contact Info')).toBeInTheDocument();
    });
});
