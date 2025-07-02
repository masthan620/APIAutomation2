
Feature: Device Mapping and Unmapping
    
  Rule: Device Mapping To School Testcases
    Scenario: MIRA-1379 - Map Device to School- Verify successful mapping of a device.
      Given register device
      Then the response status code should be 200
      And map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database
    
    Scenario: MIRA-1380 - Map Device to School- Verify device already mapped.
      Given register device
      Then the response status code should be 200
      Given map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database "true"
      And map the device to school
      Then the response status code should be 200
      #And verify the device is mapped to the school in the database "false"
      And response should have the following properties:
        | message       | already_mapped_msg |


    @map
    Scenario: MIRA-1384 - Map Device to School - Verify API behavior when school_code parameter is missing
      Given register device
      Then the response status code should be 200
      When map the device to school with schoolCode " "
      Then the response status code should be 404
      And response should have the following properties:
        | message | school_not_found_msg |


  Rule: Device Unmapping To School Testcases

    @unmap
    Scenario: MIRA-1404 - Unmap Device from School- Verify successful unmapping of a device.
      Given register device
      Then the response status code should be 200
      Given map the device to school
      Then the response status code should be 200
      And response should have fields "device_color, message, device_no"
      And verify the device is mapped to the school in the database
      When unmap the device from the school
      Then the response status code should be 200
      And response should have the following properties:
      | message  | unmap_message   |
      And verify the device is unmapped from the school in the database
