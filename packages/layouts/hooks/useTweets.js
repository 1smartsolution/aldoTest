import { tweetsActions, tweetsSelectors } from '@template/services';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useTweets = ({page}) => {
  const dispatch = useDispatch();
  const tweets = useSelector(tweetsSelectors.tweetsSelector) || [];

    useEffect(() => {
        if (page)
        {
            dispatch(tweetsActions.getTweets({page}));
        }
    }, [page])


  return {
    tweets
  }
}