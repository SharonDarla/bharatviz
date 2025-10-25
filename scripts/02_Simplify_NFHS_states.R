library(tidyverse)
library(here)
library(sf)
library(rmapshaper)

states.map <- read_sf("~/github/India_NFHS_shapefiles/output/nfhs4_1_with_pok.geojson")
states.map$state_name <- states.map$DHSREGEN
states.map <- st_make_valid(states.map)
states.map <- states.map %>% arrange(state_name)
states.map <- states.map %>% select(state_name)
states.map <- st_transform(states.map, "EPSG:4326")

st_write(states.map,
         here("public/India_NFHS4_states_simplified.geojson"),
         driver = "GeoJSON",
         delete_dsn = TRUE
)


states.map <- read_sf("~/github/India_NFHS_shapefiles/output/nfhs5_1_with_pok.geojson")
states.map$state_name <- states.map$DHSREGEN
states.map <- st_make_valid(states.map)
states.map <- states.map %>% arrange(state_name)
states.map <- states.map %>% select(state_name)
states.map <- st_transform(states.map, "EPSG:4326")

st_write(states.map,
         here("public/India_NFHS5_states_simplified.geojson"),
         driver = "GeoJSON",
         delete_dsn = TRUE
)
