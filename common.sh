#!/bin/bash

CURRENT_DIR=`pwd`
HOST_NAME=`hostname`
PID="$$"

#the config path
ULIMIT_FILE_PATH0='/etc/security/limits.conf'
ULIMIT_FILE_PATH1='/etc/pam.d/common-session'
PROFILE_PATH='/etc/profile'
NTP_SERVER_CONF_PATH='/etc/ntp.conf'
SCHEDULER_PATH="/etc/crontab"
COMM_LOG_PATH="${CURRENT_DIR}/common-config.log"
CURRENT_IP=`ifconfig eth0 | sed -n 's/.*inet addr:\(.*\) Bcast.*/\1/p'`

echo "Start configuring linux kernel parameters on host ${CURRENT_IP}..." | tee -a ${COMM_LOG_PATH}

###ULIMIT#########
echo "********************************************************************" | tee -a ${COMM_LOG_PATH}
echo "* Linux Ulimit configurations(${ULIMIT_FILE_PATH0},${ULIMIT_FILE_PATH1},${PROFILE_PATH})... *" | tee -a ${COMM_LOG_PATH}
echo "********************************************************************" | tee -a ${COMM_LOG_PATH}
##################
SOFT_NOFILE="* soft nofile 65536"
HARD_NOFILE="* hard nofile 65536"
SESSION_LIMIT="session required pam_limits.so"
ULIMIT_CONTENT="ulimit -SHn 65536"
ulimit_soft=`sed -n "/$SOFT_NOFILE/p" $ULIMIT_FILE_PATH0`
ulimit_hard=`sed -n "/$HARD_NOFILE/p" $ULIMIT_FILE_PATH0`
ulimit_session=`sed -n "/$SESSION_LIMIT/p" $ULIMIT_FILE_PATH1`
ulimit_con=`sed -n "/$ULIMIT_CONTENT/p" $PROFILE_PATH`
ulimit_changed=0
if [[ -z $ulimit_soft ]];then
	sed -i "1a $SOFT_NOFILE" $ULIMIT_FILE_PATH0
	ulimit_changed=1
	echo "${HOST_NAME}:Changed $SOFT_NOFILE" | tee -a ${COMM_LOG_PATH}
fi
if [[ -z $ulimit_hard ]];then
	sed -i "1a $HARD_NOFILE" $ULIMIT_FILE_PATH0
	ulimit_changed=1
	echo "${HOST_NAME}:Changed $HARD_NOFILE" | tee -a ${COMM_LOG_PATH}
fi
if [[ -z $ulimit_session ]];then
	sed -i "1a $SESSION_LIMIT" $ULIMIT_FILE_PATH1
	ulimit_changed=1
	echo "${HOST_NAME}:Changed $SESSION_LIMIT" | tee -a ${COMM_LOG_PATH}
fi
if [[ -z $ulimit_con ]];then
	sed -i "1a $ULIMIT_CONTENT" $PROFILE_PATH
	ulimit_changed=1
	echo "${HOST_NAME}:Changed $ULIMIT_CONTENT" | tee -a ${COMM_LOG_PATH}
fi
if [[ ulimit_changed -eq 0 ]];then
	echo "${HOST_NAME}:No any change of ULIMIT was made on host !!!" | tee -a ${COMM_LOG_PATH}
fi
echo "${HOST_NAME}:Finished to configure Ulimit on host:${CURRENT_IP}" | tee -a ${COMM_LOG_PATH}

###NTP SERVER#########
echo "********************************************************************" | tee -a ${COMM_LOG_PATH} 
echo "* Linux NTP Server/Client configurations(${ULIMIT_FILE_PATH0},${ULIMIT_FILE_PATH1},${PROFILE_PATH})... *" | tee -a ${COMM_LOG_PATH}
echo "********************************************************************" | tee -a ${COMM_LOG_PATH}
######################
NTP_SERVER_HOST=192.168.219.129
C_NTP_SERVER_HOST=${NTP_SERVER_HOST//./}
C_CURRENT_IP=${CURRENT_IP//./}
ntp_changed=0

###### NTP Server configurations
if [[ "${C_NTP_SERVER_HOST}" -eq "${C_CURRENT_IP}" ]];then
declare -A ntp_conf_arr
ntp_conf_arr[ntp1]="restrict default nomodify notrap noquery"
ntp_conf_arr[ntp2]="restrict 127.0.0.1"
ntp_conf_arr[ntp3]="restrict 192.168.219.0 mask 255.255.255.0 nomodify"
ntp_conf_arr[ntp4]="server 0.pool.ntp.org"
ntp_conf_arr[ntp5]="server 1.pool.ntp.org"
ntp_conf_arr[ntp6]="server 2.pool.ntp.org"
ntp_conf_arr[ntp7]="server 127.127.1.0"     # local clock
ntp_conf_arr[ntp8]="fudge 127.127.1.0 stratum 10" #the '10' means the level of the ntp server,'0' means top level
ntp_conf_arr[ntp9]="driftfile \/var\/lib\/ntp\/ntp.drift"
ntp_conf_arr[ntp10]="broadcastdelay 0.008"
ntp_conf_arr[ntp11]="keys \/etc\/ntp\/keys"

#NTP Server: to chedk all ntp server config items
for index in ${!ntp_conf_arr[*]}
do
	conf_item="${ntp_conf_arr[$index]}"
	looking_for_item=`sed -n "/$conf_item/p" $NTP_SERVER_CONF_PATH`
	if [[ -z $looking_for_item ]];then
		#echo "$index adding item:$looking_for_item"
		sed -i "1a $conf_item" $NTP_SERVER_CONF_PATH
		echo "${HOST_NAME}:NTP Server changed!" | tee -a ${COMM_LOG_PATH}
		ntp_changed=1
	fi
done
fi

###### NTP Clients configurations


#NTP clients: syn the date from ntp server host
if [[ "${C_NTP_SERVER_HOST}" -ne "${C_CURRENT_IP}" ]];then
	echo $CURRENT_IP = $NTP_SERVER_HOST | tee -a ${COMM_LOG_PATH}
	/usr/sbin/ntpdate $NTP_SERVER_HOST
	#NTP clients: set the syn time in a scheduler, to run it in one clock 30th minutes of every day
	RUN_SHEDULE_CONF="30 01 * * * root \/usr\/sbin\/ntpdate $NTP_SERVER_HOST"
	#schedule_run=`sed -n "/${RUN_SHEDULE_CONF}/p" $SCHEDULER_PATH`
	schedule_run=`sed -n "/ntpdate ${NTP_SERVER_HOST}/p" $SCHEDULER_PATH`
	if [[ -z "$schedule_run" ]];then
		sed -i "1a $RUN_SHEDULE_CONF" $SCHEDULER_PATH
		echo "${HOST_NAME}:NTP Client changed!" | tee -a ${COMM_LOG_PATH}
		ntp_changed=1
	fi
fi
if [[ ntp_changed -eq 0 ]];then
	echo "${HOST_NAME}:No any change of NTP was made!!!" | tee -a ${COMM_LOG_PATH}
fi

echo "${HOST_NAME}:Finished to configure NTP on host:${CURRENT_IP}" | tee -a ${COMM_LOG_PATH}
