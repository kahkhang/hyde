In December 2013, Little India broke out in what came to be known Singapore's worst riots in over 40 years.
The riots were primarily fuelled by a series of misperceptions and rumours. SPF's lack of situational
awareness resulted in riots spiralling out of control, leaving 27 injured.

The post-riot COI recognised these inherent inadequacies in current operational systems through its top recommendation, 
and I quote, "[...]to help officers [...] build a better picture of
the ground situation, especially in rapidly changing scenarios."

The government's current Risk Assessment and Horizon Scanning (RAHS) system aggregates and sense-makes
social media information into a summary pdf on a daily
basis. However, a response time of one day is far too slow for time-critical scenarios.
Scenarios like the riots demand 
the use of innovative and high performing information processing methods to sense-make high-volume and
high-velocity information.

In this light, Hyde aims to revolutionise situational awareness and 
decision support. It features real-time geo-tagged 
social media data, augmented by modern NLP techniques such as 
entity recognition and sentiment analysis, to complement available open government data.

Hyde allows information analysis by user customisable regions, as compared to a 
country-wide analysis by RAHS. Today we visualise the data over the 18 newly-formed 
electoral boundaries. Regions coloured by sentiment are selectable for you to drill down to specific areas. 
Visualisations change to reflect the geographic bounds. [Select regions]

It displays region posts and sentiments and emerging word entities for a feel of the buzz on the ground.
[Select words]
We know that most people are currently enjoying Singapore's food and the SG50, but warning bells 
should sound when words like 'riot' start trending.

It helps identify potential urgent circumstances
such as floods (PUB water drain levels), illnesses (polyclinic patients), 
and traffic congestion (traffic data). [Mouse over on sidebar]
Using these, policy makers can address pertinent issues close to the ground, 
and target relevant stakeholders in specific constituencies.

In the case of the Little India Riots, SPF can 
determine the severity of the situation based on the imagery and texts from social media. 
They can identify areas with intense sentiments and use posts content 
to achieve a better picture of the ground situation.
This, coupled with road condition data, can be used to effectively deploy resources. 
They can do a route planning using the road speeds and the occurances of traffic incidents, 
and mobilise men at the place of high volume and strongly negative sentiment to quell the crowd.
[Click on road speeds & zoom in] 

Hyde can also be tailored for organisations to sieve out personalised information.
The search bar provides a tailored system to understand public reactions to a 
specific entity. [Type a product] 

Keying in "bus", "mrt", "traffic" gives an overview of the transport situation in Singapore,
while typing "windows 10" gives an accurate account of public reactions to the recently released OS. 
A slideshow of pictures tweeted and instagrammed gives valuable market insight into what most
captivates public attention. [show slideshow]
 
In addition, organisations can engage the public to gain valuable feedback
or crowd-sourced assistance via the reply function. [Show reply function]
[For example, if someone tweets about a traffic accident, authorities may tweet back
requesting information about the severity, which provides data faster than LTA's traffic cameras.]

[Exit to main map]
Ladies and Gentlemen, we present Hyde, data-visualisation on OneMap that 
integrates social-media contextually with IoT devices such as government sensor 
data in a larger information environment to facilitate real-time 
situation decision-making, planning and resource allocation.

-----
Q&A

1. Did you change code?
Just show and hide things as compared to the last time .

2. What's your accuracy of NLP library? 
It's about 60-70% accuracy. In comparison, the Stanford NLP library is 80.3%, and it's used
as the baseline worldwide for sentiment analysis. So we're not too far off. 
There are things we haven't tackled like Singlish and scarasm but it's fine for the moment, 
because Twitter & Instagram posts are like microblogging as their content is not very long.
So there is not a lot of context as compared to a document in which the Stanford NLP 
library would be more useful. 

3. Where did you get the government data?
We used some from the available APIs, and some of them, like the OneMap tiles and the 
traffic layers, we accessed the underlying ArcGIS server in OneMap. 
