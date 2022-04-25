import React from 'react'
import './About.css'
import { Button, Typography, Avatar } from '@material-ui/core'
import LinkedInIcon from '@material-ui/icons/LinkedIn'
import GithubIcon from '@material-ui/icons/GitHub'

const About = () => {
  const visitLinkedIn = () => {
    window.location = 'https://www.linkedin.com/in/shayan-jamil-4b99051ba/'
  }
  return (
    <div className="aboutSection">
      <div></div>
      <div className="aboutSectionGradient"></div>
      <div className="aboutSectionContainer">
        <Typography component="h1">About Us</Typography>

        <div>
          <div>
            <Avatar
              style={{ width: '10vmax', height: '10vmax', margin: '2vmax 0' }}
              src="me.jpeg"
              alt="Founder"
            />
            <Typography>Shayan Jamil</Typography>
            <Button onClick={visitLinkedIn} color="primary" target="blank">
              Visit LinkedIn Profile
            </Button>
            <span>
              This is a sample wesbite made by @ShayanJamil. Only with the
              purpose to learn MERN Stack with indepth concepts.
            </span>
          </div>
          <div className="aboutSectionContainer2">
            <Typography component="h2">My Accounts</Typography>
            <a
              href="https://www.linkedin.com/in/shayan-jamil-4b99051ba/"
              target="blank"
            >
              <LinkedInIcon className="linkedinSvgIcon" />
            </a>

            <a href="https://github.com/ShayanJamil519" target="blank">
              <GithubIcon className="githubSvgIcon" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
