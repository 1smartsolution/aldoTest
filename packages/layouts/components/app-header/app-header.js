import React from 'react';
import './app-header.scss';

const AppHeader = ({page,onClick}) => {
    const getNewButton = () => page==='dtTweets'?'hcTweets':'dtTweets';
    const onButtonClick = () => onClick(getNewButton());
    const getNewButtonText = () => page==='dtTweets'?'Hillary Clinton':'Donald Trump';
    const getCurrentName = () => page==='dtTweets'?'Donald Trump':'Hillary Clinton';

    return (
        <>
            <header className="header">
                <button onClick={onButtonClick}> Load {getNewButtonText()} tweets</button>
            </header>
            <h3 style={{textAlign:'center'}}>Latest {getCurrentName()} Tweets</h3>
        </>
    )
};

export default AppHeader;