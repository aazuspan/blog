import { SocialIcon } from 'react-social-icons';
import * as colors from '../styles/colors.module.scss';

export default function Social() {
  return (
    <span>
      <SocialIcon
        url="https://twitter.com/aazuspan"
        fgColor={colors.accent}
        bgColor={colors.background}
      />
      <SocialIcon
        url="https://github.com/aazuspan"
        fgColor={colors.accent}
        bgColor={colors.background}
      />
      <SocialIcon
        url="https://fosstodon.org/@aazuspan"
        fgColor={colors.accent}
        bgColor={colors.background}
      />
      <SocialIcon
        url="https://www.linkedin.com/in/aaron-zuspan-91b5261b4"
        fgColor={colors.accent}
        bgColor={colors.background}
      />
    </span>
  );
}
