import { useContext } from 'react';
import detailsIcon from '../../assets/images/details.svg';
import hideIcon from '../../assets/images/hide.svg';
import { IContactMenu } from '../../interfaces/props';
import { GlobalContext } from '../../utils/context-utils';
import {
    RightViewSelected,
    UiViewStateType,
} from '../../utils/enum-type-utils';
import { hideContact } from '../../utils/ens-utils';

export function ContactMenu(props: IContactMenu) {
    const { state, dispatch } = useContext(GlobalContext);

    const onClickOfShowDetails = () => {
        dispatch({
            type: UiViewStateType.SetSelectedRightView,
            payload: RightViewSelected.ContactInfo,
        });
    };

    const onClickOfHideContact = () => {
        hideContact(state, dispatch);
    };

    return (
        <div
            className={'dropdown-content font-size-14 font-weight-400'.concat(
                ' ',
                props.isMenuAlignedAtBottom ? '' : 'dropdown-content-top-align',
            )}
        >
            <div
                className="d-flex align-items-center justify-content-start"
                onClick={() => onClickOfShowDetails()}
            >
                <img src={detailsIcon} alt="details" className="me-2" />
                Show Details
            </div>
            <div
                className="d-flex align-items-center justify-content-start"
                onClick={() => onClickOfHideContact()}
            >
                <img src={hideIcon} alt="hide" className="me-2" />
                Hide Contact
            </div>
        </div>
    );
}
