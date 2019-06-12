import boto3
import json
ec2 = boto3.client('ec2')
default_snapshot_number = 5
print('init Lambda')


def lambda_handler(event, context):
    print('Recieve event: ', event)
    SnapshotKeyWord = event['SnapshotKeyWord']

    # List all instances in the region
    response = ec2.describe_instances(
        Filters=[
            {'Name': 'tag-key', 'Values': [SnapshotKeyWord]},
        ]
    )
    # TODO if instance >1000, use NextToken to get full list
    instances = sum(
        [
            [i for i in r['Instances']]
            for r in response['Reservations']
        ], [])
    print("Found %d instances have %s tag" % (len(instances), SnapshotKeyWord))

    # Create snapshot
    for instance in instances:
        # How many Snapshot should be keep for each volume on this EC2 instance
        try:
            snapshot_numbers = [
                int(t['Value']) for t in instance['Tags'] if t['Key'] == SnapshotKeyWord
            ][0]
        except Exception as e:
            snapshot_numbers = default_snapshot_number
            print('Err SnapshotNumbers, set to default. Err code: ', e)

        # figure out instance name if there is one
        instance_name = ""
        for tag in instance['Tags']:
            if tag['Key'] != 'Name':
                continue
            else:
                instance_name = tag['Value']
        print('\nProcessing instance %s - %s, Max %d snapshots for %d volumes' %
              (instance['InstanceId'], instance_name, snapshot_numbers, len(instance['BlockDeviceMappings'])))

        # Each volume on this EC2 instance
        for dev in instance['BlockDeviceMappings']:

            # The volume id of this instance
            if dev.get('Ebs', None) is None:
                continue  # Next Intance
            vol_id = dev['Ebs']['VolumeId']
            dev_name = dev['DeviceName']
            description = 'AutoSnapshot %s - %s (%s)' % (
                instance_name, vol_id, dev_name)
            print('Processing volume', vol_id, dev_name)

            # Trigger Snapshot
            try:
                snap = ec2.create_snapshot(
                    VolumeId=vol_id,
                    Description=description,
                    TagSpecifications=[
                        {
                            'ResourceType': 'snapshot',
                            'Tags': instance['Tags']
                        }
                    ]
                )
                if (snap):
                    print("Snapshot %s created of [%s]" % (
                        snap['SnapshotId'], description))
            except Exception as e:
                print('fail to create snapshot, err code: ', e)
                # TODO send sns notification for fail
                continue

            # List all existing snapshots with tag SnapshotKeyWord of this volume
            try:
                snapshot_response = ec2.describe_snapshots(
                    Filters=[
                        {'Name': 'tag-key', 'Values': [SnapshotKeyWord]},
                        {'Name': 'volume-id', 'Values': [vol_id]}
                    ]
                )
                snap_list = []
                for snap in snapshot_response['Snapshots']:
                    for t in snap['Tags']:
                        if t['Key'] == SnapshotKeyWord:
                            snap_list.append({
                                'SnapshotId': snap['SnapshotId'],
                                'StartTime': snap['StartTime']
                            })
                snap_exist_num = len(snap_list)
                print('There are %d snapshot for this volume' % snap_exist_num)
            except Exception as e:
                print('fail to list snapshot, err code: ', e)
                # TODO send sns notification for fail
                continue

            # Delete old snapshot
            try:
                if snap_exist_num > snapshot_numbers:
                    # How many snapshot to delete
                    delta_num = snap_exist_num - snapshot_numbers
                    for i in range(0, delta_num):

                        # search the oldest
                        snap_to_delete = snap_list[0]
                        for n in snap_list:
                            if n['StartTime'] < snap_to_delete['StartTime']:
                                snap_to_delete = n
                        # delete the oldest snap_shot
                        ec2.delete_snapshot(
                            SnapshotId=snap_to_delete['SnapshotId'])
                        snap_list.remove(snap_to_delete)
                        print('Delete snapshot n=%d of %s' %
                              (i+1, snap_to_delete['SnapshotId']))
            except Exception as e:
                print('fail to delete snapshot, err code: ', e)
                # TODO send sns notification for fail
                continue

    return {
        'statusCode': 200,
        'body': 'ok'
    }
# TODO, set the dead line queue for this lambda to send sns notification for fail
