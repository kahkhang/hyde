## Demos
* [F4 Map](http://demo.f4map.com/#lat=1.2858124&lon=103.8520830&zoom=16&camera.phi=9.798 )
* [City Dashboard] (http://citydashboard.org/london/)
* [3D map visualization] (http://heinekencitysymphony.com/)
* [Planetry.js](http://planetaryjs.com/)
* [OpenLayers](http://openlayers.org/)

## Smart FM & Smart Nation 
* NRF SMART-FM. Future Urban Mobility (FM) IRG is one of the five IRGs in the Singapore- MIT Alliance for Research and Technology (SMART) Centre. FM IRG started in July 2010 and is a research programme funded by the National Research Foundation (NRF), under its Campus for Research Excellence and Technological Enterprise (CREATE) programme.  http://smart.mit.edu/research/future-urban-mobility/future-urban-mobility.html 

* MND Smart Nation Round-table Synopses. A good stock-take of all R&T work related to Smart Nation initiatives, includes autonomous vehicles. http://www.clc.gov.sg/Research/aboutourresearch.htm 
* [Remarks by Peter Ho](http://www.ura.gov.sg/uol/media-room/speeches/2015/jun/speech15-05.aspx)

**Daryl's Thoughts**

* Singapore as a small city state can claim to have a Smart Nation initiative, c.f. other bigger countries can only claim Smart Cities.
* So What? As countries get more urbanized, Singapore Smart Nation initiative can be an exemplar, as a test-bed / sand-box to illustrate ideas and concepts – a microcosm on what can be done, how its done, the  challenges, workarounds and lessons learnt.   And now, imagine, instead of exporting raw materials, 
Singapore can export the Smart Nation InfoComm Technologies (ICT) “know-how” to other countries. 


### Tools
* [Web Scraper Outwit](http://www.outwit.com/products/hub/download/?gclid=CPjDtu--gcYCFZaXvQodOnIA6A#ectrans=1)
* [Google Polymer](http://polymer-project.org)
* [Polymer Starter Kit](https://developers.google.com/web/tools/polymer-starter-kit/)
* [OneMap API] (http://www.onemap.sg)
* [H2O](http://h2o.ai/)
* [KNIME](https://www.knime.org/)
* [Scrapy for scraping the web](http://scrapy.org/)
* [Leaflet.js](http://leafletjs.com/)

## Books
* [Doing Data Science, O'Reilly] (http://shop.oreilly.com/product/0636920028529.do)
* [Mining Massive DataSets, Stanford University](http://infolab.stanford.edu/~ullman/mmds/book.pdf)
* [Networks, Crowds and Markets by Cornell University](http://www.cs.cornell.edu/home/kleinber/networks-book/networks-book.pdf)
* [Latent Space Approaches to Social Network Analysis by Peter Hoff](https://www.stat.washington.edu/raftery/Research/PDF/hoff2002.pdf)
* [Assessing Degeneracy in Statistical Models of Social
Networks by Mark Handock](https://www.csss.washington.edu/Papers/2003/wp39.pdf)
* [Python for Data Analysis, O'Reilly](http://shop.oreilly.com/product/0636920023784.do)


## A Data Sandbox (Daryl's Idea)
#### Background
data.gov.sg is the one-stop portal to discovering publicly-available government data, tapping into selected datasets to create applications or conduct research, and looking for interesting applications developed using government data. Agencies have been actively contributing to the portal and its rich knowledge-base of SG data. Unfortunately:
-	The data formats are multi-varieted, e.g. Adobe PDF, XML meta-data, ASCII Text and Google KML format, which makes it difficult for a citizen to explore and discover insights.  SLA has a onemap.sg platform, but it requires highly curated data, i.e. map data must conform to a particular standard, which in turn require a technical expertise to geo-code text documents.
-	It’s a “stove-pipe” and “sorted-by-agency” data repository.

#### Idea
To develop a proof-of-concept SG data analytics platform, based on open standards and architecture to:
-	Sense-make geo-spatial open-data e.g. automatically resolve postal code to a lat-lon coordinate.  
-	Introduce dynamic geospatial information layers, e.g. crowd-sourced traffic data, LTA/PUB traffic & flood cameras, to provide a traffic trending over time in at area. 
-	Allow citizens to “mix-n-match” data sets to derive new insights and possibly discover causality and unintended consequences of Singapore government policy-making, through her various agencies. 
-	Benefits. Empower citizen to have a ”voice” to aid policy-making, e.g. sounding out unintended gaps to policy-makers.

A simple example on resolving location, e.g. BCA publishes building plans in ASCII TEXT (see attached), construction activities provide an indication of national economic development, more is better. Display BCA ASCII data on a map to facilitate clustering, by resolving postal code 117937, to a coordinate 1.27869 103.79029 

> A0224-00009-2012-BP02|PROPOSED RECONSTRUCTION WITH  ADDITION OF 3RD STOREY TO AN EXISTING 2-STOREY INTERMEDIATE TERRACE DWELLING HOUSE ON LOT 02421W MK03 AT 9 SPRINGWOOD WALK, QUEENSTOWN PLANNING AREA.|ON LOT(S) 02421W  MK03 AT 9 SPRINGWOOD WALK SINGAPORE 117937|MR WONG KOK YAN WONG KOK YAN CHARTERED ARCHITECT AND PLANNER|NG CHENG HAI NEXG GROUP DESIGN|02/01/2014
(From BCA Building Plan Listing.txt)

## Translating BCA data
Text file : https://www.bca.gov.sg/bcadata/BuildingPlan_Listing.txt  
Example field : ON LOT(S) 04950X  MK23 AT 6A  JALAN PUNAI  
Extracted Lot Number: MK23-04950X [MK23 (Lot number) - 04950 (survey district number) - X (lot check digit)]  
(More information: http://www.sla.gov.sg/Services/PropertyBoundaries/AllocationofLotNumbers.aspx)  
Resolve by querying here (need to scrape) : https://www.rpz.inlis.gov.sg/Layout/Products_SearchResult.aspx  
OneMaps API for extracting more information: http://www.onemap.sg/api/help/  
Type of work: Reconstruction/ Erection/ Addition/ Extension

## KK's SandBox
KK’s Sandbox is an important piece.  Its meant to be a data discovery toolbox for users and developers in the defence eco-system.
To encourage you, here’s a Hackathon idea – 
-	point the data ingestion pipelines from your (Knime) sandbox, cleanse the data include resolve locations 
-	basic visual analytics e.g. an agency-specific datasets
-	advanced analytics e.g. run thru’ an R library of algorithms (simple K-means cluster) of >2 agency datasets.
-	Others. Hosting on a public-cloud infrastructure. An example of Leaflet web-mapping on Dropbox (sits on AWS):
https://dl.dropboxusercontent.com/u/29475418/leaflet/leaflet_kml2.htm 
